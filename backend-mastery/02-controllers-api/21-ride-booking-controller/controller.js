const { v4: uuidv4 } = require('uuid');

const bookings = new Map();
const drivers = new Map();

class RideBookingController {
  static async requestRide(req, res) {
    try {
      const { pickupLocation, dropoffLocation, userId, rideType } = req.body;
      const bookingId = uuidv4();
      
      const booking = {
        id: bookingId,
        userId,
        pickupLocation,
        dropoffLocation,
        rideType: rideType || 'standard',
        status: 'requested',
        estimatedCost: 25.50,
        estimatedDuration: '12 mins',
        createdAt: new Date()
      };
      
      bookings.set(bookingId, booking);
      res.status(201).json(booking);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async acceptRide(req, res) {
    try {
      const { bookingId, driverId } = req.body;
      const booking = bookings.get(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      
      booking.status = 'accepted';
      booking.driverId = driverId;
      booking.acceptedAt = new Date();
      
      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async completeRide(req, res) {
    try {
      const { bookingId, rating, feedback } = req.body;
      const booking = bookings.get(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      
      booking.status = 'completed';
      booking.rating = rating;
      booking.feedback = feedback;
      booking.completedAt = new Date();
      
      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}
module.exports = RideBookingController;