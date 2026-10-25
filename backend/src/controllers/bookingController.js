const bookingModel = require('../models/bookingModel');
const roomModel = require('../models/roomModel');

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'checked_in', 'completed'];

const list = async (req, res) => {
  try {
    const result = await bookingModel.getAllBookings();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

const getOne = async (req, res) => {
  try {
    const result = await bookingModel.getBookingById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
};

const create = async (req, res) => {
  const { student_id, room_id, check_in_date, expected_check_out, status } = req.body;

  if (!student_id || !room_id || !check_in_date || !expected_check_out) {
    return res.status(400).json({ error: 'student_id, room_id, check_in_date, and expected_check_out are required.' });
  }
  if (new Date(check_in_date) >= new Date(expected_check_out)) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
  }

  const finalStatus = status || 'pending';
  if (!VALID_STATUSES.includes(finalStatus)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  try {
    // If creating as confirmed or checked_in, enforce capacity.
    if (finalStatus === 'confirmed' || finalStatus === 'checked_in') {
      const room = await roomModel.getRoomById(room_id);
      if (room.rows.length === 0) {
        return res.status(404).json({ error: 'Room not found.' });
      }
      const capacity = room.rows[0].capacity;
      const overlapping = await bookingModel.countOverlapping(room_id, check_in_date, expected_check_out);
      if (overlapping >= capacity) {
        return res.status(400).json({
          error: `Room is fully booked for these dates. Capacity: ${capacity}, overlapping bookings: ${overlapping}.`,
        });
      }
    }

    const result = await bookingModel.createBooking({
      student_id,
      room_id,
      check_in_date,
      expected_check_out,
      status: finalStatus,
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
};

const update = async (req, res) => {
  const { room_id, check_in_date, expected_check_out } = req.body;
  if (!room_id || !check_in_date || !expected_check_out) {
    return res.status(400).json({ error: 'room_id, check_in_date, and expected_check_out are required.' });
  }
  if (new Date(check_in_date) >= new Date(expected_check_out)) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
  }

  try {
    const existing = await bookingModel.getBookingById(req.params.id);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const booking = existing.rows[0];

    // Enforce capacity for active bookings.
    if (booking.status === 'confirmed' || booking.status === 'checked_in') {
      const room = await roomModel.getRoomById(room_id);
      if (room.rows.length === 0) {
        return res.status(404).json({ error: 'Room not found.' });
      }
      const overlapping = await bookingModel.countOverlapping(
        room_id,
        check_in_date,
        expected_check_out,
        parseInt(req.params.id, 10)
      );
      if (overlapping >= room.rows[0].capacity) {
        return res.status(400).json({
          error: `Room does not have capacity for these dates. Overlapping bookings: ${overlapping}.`,
        });
      }
    }

    const result = await bookingModel.updateBooking(req.params.id, {
      room_id,
      check_in_date,
      expected_check_out,
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
};

const confirm = async (req, res) => {
  try {
    const existing = await bookingModel.getBookingById(req.params.id);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const b = existing.rows[0];
    if (b.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be confirmed.' });
    }

    // Check capacity before confirming.
    const room = await roomModel.getRoomById(b.room_id);
    const overlapping = await bookingModel.countOverlapping(
      b.room_id,
      b.check_in_date,
      b.expected_check_out,
      b.id
    );
    if (overlapping >= room.rows[0].capacity) {
      return res.status(400).json({
        error: `Cannot confirm: room capacity exceeded. Overlapping bookings: ${overlapping}.`,
      });
    }

    const result = await bookingModel.updateStatus(req.params.id, 'confirmed');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to confirm booking.' });
  }
};

const cancel = async (req, res) => {
  try {
    const existing = await bookingModel.getBookingById(req.params.id);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (existing.rows[0].status === 'completed' || existing.rows[0].status === 'cancelled') {
      return res.status(400).json({ error: 'This booking cannot be cancelled.' });
    }
    const result = await bookingModel.updateStatus(req.params.id, 'cancelled');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
};

const checkIn = async (req, res) => {
  try {
    const existing = await bookingModel.getBookingById(req.params.id);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (existing.rows[0].status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be checked in.' });
    }
    const result = await bookingModel.checkIn(req.params.id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in student.' });
  }
};

const checkOut = async (req, res) => {
  try {
    const existing = await bookingModel.getBookingById(req.params.id);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (existing.rows[0].status !== 'checked_in') {
      return res.status(400).json({ error: 'Only checked-in bookings can be checked out.' });
    }
    const result = await bookingModel.checkOut(req.params.id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check out student.' });
  }
};

module.exports = { list, getOne, create, update, confirm, cancel, checkIn, checkOut };
