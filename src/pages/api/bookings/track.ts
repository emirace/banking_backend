import type { NextApiResponse } from "next";
import dbConnect from "@/utils/dbConnect";
import Booking from "@/model/booking";
import corsMiddleware, {
  AuthenticatedRequest,
  authenticateUser,
} from "@/utils/middleware";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  await corsMiddleware(req, res);

  await dbConnect();

  switch (req.method) {
    case "POST":
      return getTrackBooking(req, res);
    default:
      return res.status(405).json({ message: "Method Not Allowed" });
  }
}

// GET /api/bookings/user/:userId → Get all bookings of a user
const getTrackBooking = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({ bookingId })
      .populate("flightId")
      .populate("seatId");

    if (!booking) {
      res.status(404).json("Booking not found");
      return;
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user bookings", error });
    console.log(error);
  }
};

export default authenticateUser(handler);
