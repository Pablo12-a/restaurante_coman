require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/user'); // Ajuste de ruta

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado a MongoDB');

    try {
      const newUser = new User({
        username: 'test',
        password: 'test123',
        name: 'Usuario de Prueba',
        role: 'admin'
      });

      await newUser.save();
      console.log('Usuario creado exitosamente:', newUser.username);
    } catch (error) {
      console.error('Error al crear usuario:', error);
    } finally {
      mongoose.disconnect();
      console.log('Desconectado de MongoDB');
    }
  })
  .catch(err => console.error('Error de conexión a MongoDB:', err));
