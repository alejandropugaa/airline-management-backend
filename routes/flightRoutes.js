const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');
const Employee = require('../models/Employee');
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/authMiddleware');

// --- Helpers para crear/borrar schedules ---
async function createSchedulesForCrew(crewIds, departureTime, arrivalTime, flightId) {
  const depDate = new Date(departureTime);
  const arrDate = new Date(arrivalTime);

  if (isNaN(depDate.getTime()) || isNaN(arrDate.getTime())) {
    console.error('❌ departureTime o arrivalTime inválidos');
    return;
  }

  const day = depDate.toLocaleDateString('es-MX', { weekday: 'long' });
  const startTime = depDate.toTimeString().slice(0, 5);
  const endTime = arrDate.toTimeString().slice(0, 5);

  await Promise.all(
    crewIds.map(async (empId) => {
      const emp = await Employee.findById(empId);
      if (!emp) return;

      const schedule = new Schedule({
        employee: emp._id,
        flight: flightId, // ✨ Importante
        day,
        startTime,
        endTime
      });

      await schedule.save();
    })
  );
}

async function deleteSchedulesForCrew(crewIds, flightId) {
  if (!crewIds.length) return;

  await Schedule.deleteMany({
    employee: { $in: crewIds },
    flight: flightId
  });
}


// Eliminar vuelo (Solo Admin)
router.delete('/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const flightId = req.params.id;
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: 'Vuelo no encontrado' });
    }

    // 1) Comprueba si hay reservas asociadas
    const reservationsCount = await Reservation.countDocuments({ flight: flightId });
    if (reservationsCount > 0) {
      return res.status(400).json({
        message: `Este vuelo tiene ${reservationsCount} reserva(s) asociada(s). ` +
                 `Mejor cámbialo a status 'cancelled' en lugar de eliminarlo.`
      });
    }

    // 2) Borra schedules de tripulación (si existen)
    try {
      await deleteSchedulesForCrew(flight.crew || [], flight._id);
    } catch (schedErr) {
      console.warn('No se pudieron borrar todos los schedules, pero continuamos:', schedErr);
    }

    // 3) Ahora sí elimina el vuelo
    await flight.remove();
    res.json({ message: 'Vuelo eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar vuelo:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});


// Crear vuelo (Solo Admin)
router.post('/', authMiddleware(['admin']), async (req, res) => {
  const { flightNumber, origin, destination, departureTime, arrivalTime, aircraft, crew = [], price } = req.body;
  try {
    const flight = new Flight({ flightNumber, origin, destination, departureTime, arrivalTime, aircraft, crew, price });
    await flight.save();

    // Crear schedules con el ID del vuelo
    await createSchedulesForCrew(crew, departureTime, arrivalTime, flight._id);

    res.status(201).json(flight);
  } catch (error) {
    console.error('Error al crear vuelo:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Actualizar vuelo (Admin o Empleado)
router.put('/:id', authMiddleware(['admin', 'employee']), async (req, res) => {
  try {
    const original = await Flight.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ message: 'Vuelo no encontrado' });

    const oldCrew = (original.crew || []).map(String);

    // Si no se envió crew, se conserva el actual
    const newCrew = req.body.crew ?? original.crew;

    // Si no se envió departureTime o arrivalTime, se conservan los actuales
    const departureTime = req.body.departureTime ?? original.departureTime;
    const arrivalTime = req.body.arrivalTime ?? original.arrivalTime;

    const updated = await Flight.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        crew: newCrew,
        departureTime,
        arrivalTime
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Vuelo no encontrado' });

    const removed = oldCrew.filter(id => !newCrew.includes(id));
    const added   = newCrew.filter(id => !oldCrew.includes(id));
    const stayed  = newCrew.filter(id => oldCrew.includes(id));

    // Eliminar schedules de empleados que ya no están en la tripulación
    await deleteSchedulesForCrew(removed, updated._id);

    // Crear nuevos schedules
    await createSchedulesForCrew(added, departureTime, arrivalTime, updated._id);

    // Actualizar horarios para los empleados que se mantienen
    const day = new Date(departureTime).toLocaleDateString('es-MX', { weekday: 'long' });
    const startTime = new Date(departureTime).toTimeString().slice(0, 5);
    const endTime = new Date(arrivalTime).toTimeString().slice(0, 5);

    await Schedule.updateMany(
      { flight: updated._id, employee: { $in: stayed } },
      { day, startTime, endTime }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar vuelo:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener todos los vuelos
router.get('/', authMiddleware(['admin', 'employee', 'customer']), async (req, res) => {
  try {
    const flights = await Flight.find()
      .populate({
        path: 'crew',
        populate: {
          path: 'user',
          model: 'User'
        }
      })
      .populate('aircraft').lean(); // ← Mostrar detalles del avión

    res.json(flights);
  } catch (error) {
    console.error('Error al obtener vuelos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});
module.exports = router;
