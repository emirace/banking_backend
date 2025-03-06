import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Payment from "@/model/payment";
import corsMiddleware from "@/utils/middleware";
import Booking from "@/model/booking";
import sendEmail from "@/utils/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await corsMiddleware(req, res);
  await dbConnect();

  switch (req.method) {
    case "GET":
      return getPaymentById(req, res);
    case "PUT":
      return updatePaymentStatus(req, res);
    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

// GET /api/payments/:id → Get payment details
const getPaymentById = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.query;
    const payment = await Payment.findById(id)
      .populate("bookingId")
      .populate("userId");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment details", error });
    console.log(error);
  }
};

// PUT /api/payments/:id → Update payment status
const updatePaymentStatus = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { id } = req.query;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Payment status is required" });
    }

    // Update the payment status
    const payment = await Payment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Get the booking ID from the payment record
    const bookingId = payment.bookingId;

    if (!bookingId) {
      return res
        .status(400)
        .json({ message: "Booking ID not found in payment" });
    }

    // Update the corresponding booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      status === "successful"
        ? { status: "confirmed", paymentStatus: "paid" }
        : { status: "cancelled", paymentStatus: "failed" },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Commit the transaction

    // Prepare email details
    let text = "";
    if (status === "successful") {
      text =
        `Dear ${payment.userId.name},\n\n` +
        `Your payment was successful, and your booking has been confirmed!\n\n` +
        `📌 **Booking Details:**\n` +
        `- **Booking ID:** ${booking.bookingId}\n` +
        `- **Flight Number:** ${booking.flightId.flightNumber}\n` +
        `- **Origin:** ${booking.flightId.origin.city}\n` +
        `- **Destination:** ${booking.flightId.destination.city}\n` +
        `- **Departure:** ${new Date(
          booking.flightId.departureTime
        ).toLocaleString()}\n` +
        `- **Arrival:** ${new Date(
          booking.flightId.arrivalTime
        ).toLocaleString()}\n` +
        `- **Class:** ${booking.class}\n` +
        `- **Travellers:** ${booking.travellers.length} person(s)\n\n` +
        `Thank you for choosing us! ✈️`;
    } else {
      text =
        `Dear ${payment.userId.name},\n\n` +
        `Unfortunately, your payment has failed, and your booking has been cancelled.\n` +
        `Please try again or contact support for assistance.\n\n` +
        `📌 **Reason:** ${reason || "Contact support"}\n` +
        `📌 **Booking ID:** ${booking.bookingId}\n` +
        `- **Flight Number:** ${booking.flightId.flightNumber}\n` +
        `- **Origin:** ${booking.flightId.origin.city}\n` +
        `- **Destination:** ${booking.flightId.destination.city}\n\n` +
        `We're here to help. Reach out to our support team for any questions!`;
    }

    // Send email notification
    await sendEmail({
      to: payment.confirmEmail || payment.userId.email,
      subject: `Payment ${status}`,
      text,
    });

    res
      .status(200)
      .json({ message: "Payment status updated", payment, booking });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Error updating payment status", error });
  }
};
