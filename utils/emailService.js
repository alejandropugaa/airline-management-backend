const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendConfirmationEmail = async (email, reservation) => {
  const flight = reservation.flight;

  const mailOptions = {
    from: `"Aerolínea Virtual" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Confirmación de Reservación',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f4f6f8; border-radius: 8px;">
        <h2 style="color: #2c3e50;">¡Reservación Confirmada! ✈️</h2>
        <p>Hola,</p>
        <p>Tu reservación ha sido confirmada con éxito. Aquí tienes los detalles:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px;"><strong>Ticket:</strong></td><td>${reservation.ticketNumber || reservation._id}</td></tr>
          <tr><td style="padding: 8px;"><strong>Vuelo:</strong></td><td>${flight.flightNumber}</td></tr>
          <tr><td style="padding: 8px;"><strong>Ruta:</strong></td><td>${flight.origin} ➔ ${flight.destination}</td></tr>
          <tr><td style="padding: 8px;"><strong>Fecha de salida:</strong></td><td>${new Date(flight.departureTime).toLocaleString()}</td></tr>
          <tr><td style="padding: 8px;"><strong>Fecha de llegada:</strong></td><td>${new Date(flight.arrivalTime).toLocaleString()}</td></tr>
          <tr><td style="padding: 8px;"><strong>Asiento:</strong></td><td>${reservation.seatNumber}</td></tr>
        </table>
        <p style="margin-top: 20px;">Gracias por volar con nosotros. ¡Buen viaje! 🌍</p>
        <p style="color: #999; font-size: 0.9rem;">Este mensaje es generado automáticamente. No respondas a este correo.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendCancellationEmail = async (email, reservation, refundAmount) => {
  const flight = reservation.flight;

  const mailOptions = {
    from: `"Aerolínea Virtual" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '❌ Cancelación de Reservación y Reembolso',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #fff3f3; border-radius: 8px;">
        <h2 style="color: #c0392b;">Reservación Cancelada</h2>
        <p>Hola,</p>
        <p>Tu reservación ha sido cancelada correctamente. A continuación, los detalles:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px;"><strong>Ticket:</strong></td><td>${reservation.ticketNumber || reservation._id}</td></tr>
          <tr><td style="padding: 8px;"><strong>Vuelo:</strong></td><td>${flight.flightNumber}</td></tr>
          <tr><td style="padding: 8px;"><strong>Ruta:</strong></td><td>${flight.origin} ➔ ${flight.destination}</td></tr>
          <tr><td style="padding: 8px;"><strong>Fecha de salida:</strong></td><td>${new Date(flight.departureTime).toLocaleString()}</td></tr>
          <tr><td style="padding: 8px;"><strong>Asiento:</strong></td><td>${reservation.seatNumber}</td></tr>
          <tr><td style="padding: 8px;"><strong>Reembolso:</strong></td><td>$${refundAmount.toFixed(2)}</td></tr>
        </table>
        <p style="margin-top: 20px;">Lamentamos que no hayas podido viajar. Esperamos verte pronto de nuevo. 🛫</p>
        <p style="color: #999; font-size: 0.9rem;">Este mensaje es generado automáticamente. No respondas a este correo.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationCodeEmail = async (email, code) => {
  const mailOptions = {
    from: `"Aerolínea Virtual" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Verificación de Registro',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50;">Tu Código de Verificación</h2>
        <p>Gracias por registrarte. Usa el siguiente código para verificar tu dirección de correo electrónico:</p>
        <h1 style="color: #42b983; font-size: 28px;">${code}</h1>
        <p>Este código expirará en <strong>5 minutos</strong>.</p>
        <p style="font-size: 0.9em; color: #888;">Si tú no iniciaste este registro, puedes ignorar este correo.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


module.exports = {
  sendConfirmationEmail,
  sendCancellationEmail,
  sendVerificationCodeEmail
};

