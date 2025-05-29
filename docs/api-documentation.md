# Sistema de Gestión de Aerolíneas API

## Descripción General
La API del Sistema de Gestión de Aerolíneas es un backend RESTful para gestionar operaciones de una aerolínea, incluyendo autenticación de usuarios, gestión de vuelos, perfiles de clientes, reservaciones, pagos, horarios de empleados y seguimiento de equipaje. Está construida con Node.js, Express.js y MongoDB Atlas, utiliza JWT para autenticación y Nodemailer para enviar correos de confirmación.

Esta documentación proporciona instrucciones detalladas para probar la API usando **Postman**, incluyendo cuerpos de solicitud en JSON y autenticación con token Bearer. Todos los endpoints se prueban localmente en `http://localhost:5000/api`.

## URL Base
`http://localhost:5000/api`

## Configuración de Autenticación en Postman
La mayoría de los endpoints requieren un token JWT para autenticación, pasado en el encabezado `Authorization` como `Bearer <token>`. Para probar la API:

1. **Inicia el servidor**:
   ```bash
   node server.js
   ```
   Asegúrate de ver: `Servidor ejecutándose en el puerto 5000` y `MongoDB conectado`.

2. **Genera tokens**:
   - Registra o inicia sesión con usuarios de diferentes roles (`admin`, `employee`, `customer`) para obtener tokens.
   - Ejemplo: Registrar un usuario admin:
     - **Método**: POST
     - **URL**: `http://localhost:5000/api/auth/register`
     - **Cuerpo** (JSON crudo):
       ```json
       {
         "email": "admin@example.com",
         "password": "admin123",
         "role": "admin"
       }
       ```
     - **Respuesta**:
       ```json
       {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
       ```
   - Inicia sesión para obtener un token fresco:
     - **Método**: POST
     - **URL**: `http://localhost:5000/api/auth/login`
     - **Cuerpo** (JSON crudo):
       ```json
       {
         "email": "admin@example.com",
         "password": "admin123"
       }
       ```
     - **Respuesta**:
       ```json
       {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
       ```

3. **Configura Postman**:
   - Para cada endpoint protegido, agrega el encabezado `Authorization`:
     - Clave: `Authorization`
     - Valor: `Bearer <token>` (pega el token obtenido en el inicio de sesión).
   - Agrega el encabezado `Content-Type` para solicitudes POST/PUT:
     - Clave: `Content-Type`
     - Valor: `application/json`

4. **Roles**:
   - `admin`: Puede acceder a todos los endpoints (por ejemplo, crear vuelos, reembolsar pagos).
   - `employee`: Puede actualizar estados de vuelos, gestionar equipaje, ver horarios.
   - `customer`: Puede crear reservaciones, gestionar perfiles, registrar equipaje.

## Endpoints

### 1. Autenticación (`/api/auth`)
Gestiona el registro e inicio de sesión de usuarios.

#### POST /auth/register
**Descripción**: Registra un nuevo usuario (admin, empleado o cliente).
- **Acceso**: Público (no requiere token).
- **Cuerpo** (JSON crudo):
  ```json
  {
    "email": "cliente@example.com",
    "password": "cliente123",
    "role": "customer"
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Casos de Error**:
  - Correo ya registrado (400 Solicitud Incorrecta):
    ```json
    {"message":"El usuario ya existe"}
    ```
  - Rol inválido (400 Solicitud Incorrecta):
    ```json
    {"message":"Rol inválido"}
    ```

**Prueba en Postman**:
1. Envía la solicitud con el cuerpo anterior.
2. Intenta registrar con el mismo correo para provocar el error.
3. Registra usuarios con diferentes roles (`admin`, `employee`, `customer`).

#### POST /auth/login
**Descripción**: Inicia sesión y obtiene un token JWT.
- **Acceso**: Público (no requiere token).
- **Cuerpo** (JSON crudo):
  ```json
  {
    "email": "cliente@example.com",
    "password": "cliente123"
  }
  ```
- **Respuesta** (200 OK):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Casos de Error**:
  - Credenciales inválidas (401 No Autorizado):
    ```json
    {"message":"Credenciales inválidas"}
    ```

**Prueba en Postman**:
1. Inicia sesión con las credenciales del usuario registrado.
2. Intenta con una contraseña incorrecta para provocar el error.
3. Guarda el token para usarlo en endpoints protegidos.

### 2. Vuelos (`/api/flights`)
Gestiona la creación, consulta y actualización de vuelos.

#### POST /flights
**Descripción**: Crea un nuevo vuelo (solo admin).
- **Acceso**: Requiere token `admin`.
- **Encabezados**:
  - `Authorization: Bearer <token_admin>`
  - `Content-Type: application/json`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "flightNumber": "FL789",
    "origin": "MEX",
    "destination": "LAX",
    "departureTime": "2025-05-16T10:00:00Z",
    "arrivalTime": "2025-05-16T12:00:00Z",
    "aircraft": "Boeing 737",
    "crew": []
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "flightNumber": "FL789",
    "origin": "MEX",
    "destination": "LAX",
    "departureTime": "2025-05-16T10:00:00.000Z",
    "arrivalTime": "2025-05-16T12:00:00.000Z",
    "aircraft": "Boeing 737",
    "crew": [],
    "status": "scheduled",
    "_id": "682063b08fa865e5f32826cd",
    "createdAt": "2025-05-11T08:45:36.622Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Sin token (401 No Autorizado):
    ```json
    {"message":"No se proporcionó token"}
    ```
  - Token inválido (401 No Autorizado):
    ```json
    {"message":"Invalid token"}
    ```
  - Usuario no admin (403 Prohibido):
    ```json
    {"message":"Acceso denegado"}
    ```

**Prueba en Postman**:
1. Usa un token admin en el encabezado `Authorization`.
2. Envía la solicitud con el cuerpo anterior.
3. Intenta enviar sin token o con un token de cliente para provocar errores.
4. Guarda el `_id` del vuelo creado para usarlo en reservaciones.

#### GET /flights
**Descripción**: Obtiene todos los vuelos (accesible para todos los roles).
- **Acceso**: Requiere token `admin`, `employee` o `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token>`
- **Respuesta** (200 OK):
  ```json
  [
    {
      "_id": "682063b08fa865e5f32826cd",
      "flightNumber": "FL789",
      "origin": "MEX",
      "destination": "LAX",
      "departureTime": "2025-05-16T10:00:00.000Z",
      "arrivalTime": "2025-05-16T12:00:00.000Z",
      "aircraft": "Boeing 737",
      "crew": [],
      "status": "scheduled",
      "createdAt": "2025-05-11T08:45:36.622Z",
      "__v": 0
    }
  ]
  ```
- **Casos de Error**:
  - Sin token (401 No Autorizado):
    ```json
    {"message":"No se proporcionó token"}
    ```

**Prueba en Postman**:
1. Prueba con tokens de `admin`, `employee` y `customer`.
2. Verifica que la respuesta incluya el vuelo creado.
3. Intenta sin token para provocar el error.

#### PUT /flights/:id
**Descripción**: Actualiza el estado de un vuelo (solo admin o empleado).
- **Acceso**: Requiere token `admin` o `employee`.
- **Encabezados**:
  - `Authorization: Bearer <token_admin_o_empleado>`
  - `Content-Type: application/json`
- **URL**: `http://localhost:5000/api/flights/682063b08fa865e5f32826cd`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "status": "delayed"
  }
  ```
- **Respuesta** (200 OK):
  ```json
  {
    "_id": "682063b08fa865e5f32826cd",
    "flightNumber": "FL789",
    "origin": "MEX",
    "destination": "LAX",
    "departureTime": "2025-05-16T10:00:00.000Z",
    "arrivalTime": "2025-05-16T12:00:00.000Z",
    "aircraft": "Boeing 737",
    "crew": [],
    "status": "delayed",
    "createdAt": "2025-05-11T08:45:36.622Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Vuelo no encontrado (404 No Encontrado):
    ```json
    {"message":"Vuelo no encontrado"}
    ```
  - Token de cliente (403 Prohibido):
    ```json
    {"message":"Acceso denegado"}
    ```

**Prueba en Postman**:
1. Usa el `_id` del vuelo creado.
2. Prueba con un token admin y uno de empleado.
3. Intenta con un token de cliente para provocar el error.
4. Intenta con un `_id` inválido para provocar el error 404.

### 3. Clientes (`/api/customers`)
Gestiona los perfiles de clientes.

#### POST /customers
**Descripción**: Crea un perfil de cliente (solo cliente).
- **Acceso**: Requiere token `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token_cliente>`
  - `Content-Type: application/json`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "passport": "ABC123",
    "contactInfo": {
      "phone": "1234567890",
      "address": "Calle 123"
    },
    "preferences": {
      "seatPreference": "window",
      "mealPreference": "vegetarian"
    }
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "_id": "682064a28fa865e5f32826d0",
    "user": "<user_id>",
    "passport": "ABC123",
    "contactInfo": {
      "phone": "1234567890",
      "address": "Calle 123"
    },
    "preferences": {
      "seatPreference": "window",
      "mealPreference": "vegetarian"
    },
    "frequentFlyer": {
      "status": "none",
      "points": 0
    },
    "createdAt": "2025-05-11T09:00:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Sin token (401 No Autorizado):
    ```json
    {"message":"No se proporcionó token"}
    ```
  - Token no de cliente (403 Prohibido):
    ```json
    {"message":"Acceso denegado"}
    ```

**Prueba en Postman**:
1. Registra un usuario cliente e inicia sesión para obtener un token.
2. Envía la solicitud con el cuerpo anterior.
3. Intenta con un token admin para provocar el error.
4. Guarda el `_id` del cliente para usarlo en reservaciones.

#### GET /customers/profile
**Descripción**: Obtiene el perfil del cliente (solo cliente).
- **Acceso**: Requiere token `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token_cliente>`
- **Respuesta** (200 OK):
  ```json
  {
    "_id": "682064a28fa865e5f32826d0",
    "user": "<user_id>",
    "passport": "ABC123",
    "contactInfo": {
      "phone": "1234567890",
      "address": "Calle 123"
    },
    "preferences": {
      "seatPreference": "window",
      "mealPreference": "vegetarian"
    },
    "frequentFlyer": {
      "status": "none",
      "points": 0
    },
    "createdAt": "2025-05-11T09:00:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Cliente no encontrado (404 No Encontrado):
    ```json
    {"message":"Cliente no encontrado"}
    ```

**Prueba en Postman**:
1. Usa el token del cliente del inicio de sesión.
2. Verifica que la respuesta coincida con el perfil creado.
3. Intenta con un token admin para provocar el error.

### 4. Reservaciones (`/api/reservations`)
Gestiona las reservaciones de vuelos y cancelaciones.

#### POST /reservations
**Descripción**: Crea una reservación (solo cliente).
- **Acceso**: Requiere token `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token_cliente>`
  - `Content-Type: application/json`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "customer": "682064a28fa865e5f32826d0",
    "flight": "682063b08fa865e5f32826cd",
    "seatNumber": "12A"
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "_id": "682065b38fa865e5f32826d3",
    "customer": "682064a28fa865e5f32826d0",
    "flight": "682063b08fa865e5f32826cd",
    "seatNumber": "12A",
    "ticketNumber": "TICKET-XYZ123",
    "status": "confirmed",
    "createdAt": "2025-05-11T09:15:00.000Z",
    "__v": 0
  }
  ```
- **Efecto Secundario**: Envía un correo de confirmación al correo del cliente.
- **Casos de Error**:
  - Cliente o vuelo no encontrado (404 No Encontrado):
    ```json
    {"message":"Cliente o vuelo no encontrado"}
    ```
  - Sin token (401 No Autorizado):
    ```json
    {"message":"No se proporcionó token"}
    ```

**Prueba en Postman**:
1. Usa los `_id` del cliente y del vuelo creados previamente.
2. Envía la solicitud y verifica la respuesta.
3. Revisa el correo del cliente para el correo de confirmación.
4. Intenta con `_id` inválidos para provocar el error.
5. Guarda el `_id` de la reservación para usarlo en pagos y equipaje.

#### PUT /reservations/:id/cancel
**Descripción**: Cancela una reservación (solo cliente).
- **Acceso**: Requiere token `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token_cliente>`
- **URL**: `http://localhost:5000/api/reservations/682065b38fa865e5f32826d3/cancel`
- **Respuesta** (200 OK):
  ```json
  {
    "_id": "682065b38fa865e5f32826d3",
    "customer": "682064a28fa865e5f32826d0",
    "flight": "682063b08fa865e5f32826cd",
    "seatNumber": "12A",
    "ticketNumber": "TICKET-XYZ123",
    "status": "cancelled",
    "createdAt": "2025-05-11T09:15:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Reservación no encontrada (404 No Encontrado):
    ```json
    {"message":"Reservación no encontrada"}
    ```

**Prueba en Postman**:
1. Usa el `_id` de la reservación creada.
2. Verifica que el estado cambie a `cancelled`.
3. Intenta con un `_id` inválido para provocar el error.

### 5. Pagos (`/api/payments`)
Gestiona el procesamiento de pagos y reembolsos.

#### POST /payments
**Descripción**: Procesa un pago para una reservación (solo cliente).
- **Acceso**: Requiere token `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token_cliente>`
  - `Content-Type: application/json`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "reservation": "682065b38fa865e5f32826d3",
    "amount": 500,
    "method": "credit_card"
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "_id": "682066c48fa865e5f32826d6",
    "reservation": "682065b38fa865e5f32826d3",
    "amount": 500,
    "method": "credit_card",
    "status": "completed",
    "createdAt": "2025-05-11T09:30:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Reservación no encontrada (404 No Encontrado):
    ```json
    {"message":"Reservación no encontrada"}
    ```

**Prueba en Postman**:
1. Usa el `_id` de la reservación creada.
2. Verifica que el pago se cree con `status: "completed"`.
3. Intenta con un `_id` de reservación inválido para provocar el error.
4. Guarda el `_id` del pago para reembolsos.

#### PUT /payments/:id/refund
**Descripción**: Reembolsa un pago (solo admin).
- **Acceso**: Requiere token `admin`.
- **Encabezados**:
  - `Authorization: Bearer <token_admin>`
- **URL**: `http://localhost:5000/api/payments/682066c48fa865e5f32826d6/refund`
- **Respuesta** (200 OK):
  ```json
  {
    "_id": "682066c48fa865e5f32826d6",
    "reservation": "682065b38fa865e5f32826d3",
    "amount": 500,
    "method": "credit_card",
    "status": "refunded",
    "createdAt": "2025-05-11T09:30:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Pago no encontrado (404 No Encontrado):
    ```json
    {"message":"Pago no encontrado"}
    ```

**Prueba en Postman**:
1. Usa el `_id` del pago creado.
2. Verifica que el estado cambie a `refunded`.
3. Intenta con un token de cliente para provocar `{"message":"Acceso denegado"}`.

### 6. Empleados (`/api/employees`)
Gestiona la creación de empleados y sus horarios.

#### POST /employees
**Descripción**: Crea un empleado (solo admin).
- **Acceso**: Requiere token `admin`.
- **Encabezados**:
  - `Authorization: Bearer <token_admin>`
  - `Content-Type: application/json`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "user": "<employee_user_id>",
    "role": "pilot",
    "schedule": [
      {
        "flight": "682063b08fa865e5f32826cd",
        "date": "2025-05-16T10:00:00Z"
      }
    ]
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "_id": "682067d58fa865e5f32826d9",
    "user": "<employee_user_id>",
    "role": "pilot",
    "schedule": [
      {
        "flight": "682063b08fa865e5f32826cd",
        "date": "2025-05-16T10:00:00.000Z",
        "_id": "some_id"
      }
    ],
    "createdAt": "2025-05-11T09:45:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Usuario no encontrado (404 No Encontrado):
    ```json
    {"message":"Usuario no encontrado"}
    ```

**Prueba en Postman**:
1. Registra un usuario empleado (`role: "employee"`) y obtén su `_id` desde MongoDB Atlas o la respuesta de inicio de sesión.
2. Envía la solicitud con el cuerpo anterior.
3. Intenta con un `_id` de usuario inválido para provocar el error.
4. Guarda el `_id` del empleado para consultar horarios.

#### GET /employees/schedule
**Descripción**: Obtiene el horario de un empleado (solo empleado).
- **Acceso**: Requiere token `employee`.
- **Encabezados**:
  - `Authorization: Bearer <token_empleado>`
- **Respuesta** (200 OK):
  ```json
  [
    {
      "flight": {
        "_id": "682063b08fa865e5f32826cd",
        "flightNumber": "FL789",
        "origin": "MEX",
        "destination": "LAX"
      },
      "date": "2025-05-16T10:00:00.000Z"
    }
  ]
  ```
- **Casos de Error**:
  - Horario no encontrado (404 No Encontrado):
    ```json
    {"message":"Horario no encontrado"}
    ```

**Prueba en Postman**:
1. Inicia sesión como empleado y usa su token.
2. Verifica que la respuesta incluya el horario creado.
3. Intenta con un token de cliente para provocar `{"message":"Acceso denegado"}`.

### 7. Equipaje (`/api/baggage`)
Gestiona el registro y actualización de equipaje.

#### POST /baggage
**Descripción**: Registra equipaje para una reservación (solo cliente).
- **Acceso**: Requiere token `customer`.
- **Encabezados**:
  - `Authorization: Bearer <token_cliente>`
  - `Content-Type: application/json`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "reservation": "682065b38fa865e5f32826d3",
    "weight": 20
  }
  ```
- **Respuesta** (201 Creado):
  ```json
  {
    "_id": "682068e68fa865e5f32826dc",
    "reservation": "682065b38fa865e5f32826d3",
    "weight": 20,
    "status": "checked",
    "boardingPass": "PASS-ABC123",
    "createdAt": "2025-05-11T10:00:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Reservación no encontrada (404 No Encontrado):
    ```json
    {"message":"Reservación no encontrada"}
    ```

**Prueba en Postman**:
1. Usa el `_id` de la reservación creada.
2. Verifica que el equipaje se cree con `status: "checked"`.
3. Intenta con un `_id` de reservación inválido para provocar el error.
4. Guarda el `_id` del equipaje para actualizaciones de estado.

#### PUT /baggage/:id
**Descripción**: Actualiza el estado del equipaje (solo empleado).
- **Acceso**: Requiere token `employee`.
- **Encabezados**:
  - `Authorization: Bearer <token_empleado>`
  - `Content-Type: application/json`
- **URL**: `http://localhost:5000/api/baggage/682068e68fa865e5f32826dc`
- **Cuerpo** (JSON crudo):
  ```json
  {
    "status": "loaded"
  }
  ```
- **Respuesta** (200 OK):
  ```json
  {
    "_id": "682068e68fa865e5f32826dc",
    "reservation": "682065b38fa865e5f32826d3",
    "weight": 20,
    "status": "loaded",
    "boardingPass": "PASS-ABC123",
    "createdAt": "2025-05-11T10:00:00.000Z",
    "__v": 0
  }
  ```
- **Casos de Error**:
  - Equipaje no encontrado (404 No Encontrado):
    ```json
    {"message":"Equipaje no encontrado"}
    ```

**Prueba en Postman**:
1. Usa el `_id` del equipaje creado.
2. Verifica que el estado cambie a `loaded`.
3. Intenta con un token de cliente para provocar `{"message":"Acceso denegado"}`.

## Guía para la Presentación del 12 de Mayo

### Preparación
1. **Inicia el Servidor**:
   - Ejecuta `node server.js` y muestra la salida en consola (`Servidor ejecutándose en el puerto 5000`, `MongoDB conectado`).
   - Asegúrate de que el archivo `.env` esté configurado:
     ```plaintext
     PORT=5000
     MONGO_URI=mongodb+srv://<usuario>:<contraseña>@cluster0.mongodb.net/airline_management?retryWrites=true&w=majority
     JWT_SECRET=tu_clave_secreta_jwt
     EMAIL_USER=tu_correo@gmail.com
     EMAIL_PASS=tu_contraseña_de_aplicacion
     ```

2. **Configura Postman**:
   - Crea una colección llamada `Sistema de Gestión de Aerolíneas`.
   - Agrega solicitudes para cada endpoint listado (14 solicitudes).
   - Usa variables de entorno para facilitar las pruebas:
     - Crea un entorno (`AirlineAPI`).
     - Agrega variables: `base_url`, `admin_token`, `employee_token`, `customer_token`.
     - Configura `base_url: http://localhost:5000/api` y actualiza los tokens después de iniciar sesión.
   - Ejemplo de uso: En el encabezado `Authorization`, usa `Bearer {{admin_token}}`.

3. **Datos de Prueba**:
   - Registra usuarios para cada rol:
     - Admin: `admin@example.com`, `admin123`, `admin`
     - Empleado: `employee@example.com`, `employee123`, `employee`
     - Cliente: `cliente@example.com`, `cliente123`, `customer`
   - Crea un vuelo (por ejemplo, `FL789`) y un perfil de cliente.
   - Crea una reservación y un pago para usar en pruebas posteriores.

4. **Respaldo**:
   - Exporta la colección de Postman y guárdala en una USB o en la nube.
   - Respalda la base de datos en MongoDB Atlas (usa la opción de exportación).
   - Sube el código a un repositorio privado en GitHub:
     ```bash
     git add .
     git commit -m "API final para presentación"
     git push origin main
     ```

### Flujo de la Demostración (10 Minutos)
1. **Introducción (1 min)**:
   - Explica el propósito: Un backend para gestionar operaciones de una aerolínea.
   - Menciona tecnologías: Node.js, Express, MongoDB Atlas, JWT, Nodemailer.

2. **Arquitectura (2 min)**:
   - Describe la estructura de carpetas (`models`, `routes`, `middleware`, `utils`).
   - Resalta características clave: Autenticación, acceso basado en roles, notificaciones por correo.

3. **Demostración en Postman (5 min)**:
   - **Autenticación**:
     - Muestra `POST /auth/register` para un cliente (`cliente@example.com`).
     - Muestra `POST /auth/login` y explica cómo se usa el token en `Authorization`.
   - **Vuelos**:
     - Crea un vuelo (`POST /flights`) con un token admin.
     - Obtén todos los vuelos (`GET /flights`) con un token de cliente.
   - **Clientes**:
     - Crea un perfil de cliente (`POST /customers`).
     - Obtén el perfil (`GET /customers/profile`).
   - **Reservaciones**:
     - Crea una reservación (`POST /reservations`) y muestra el correo de confirmación (abre Gmail).
     - Cancela la reservación (`PUT /reservations/:id/cancel`).
   - **Pagos**:
     - Procesa un pago (`POST /payments`).
     - Reembólsalo (`PUT /payments/:id/refund`) con un token admin.
   - **Empleados**:
     - Crea un empleado (`POST /employees`) con un token admin.
     - Obtén su horario (`GET /employees/schedule`).
   - **Equipaje**:
     - Registra equipaje (`POST /baggage`).
     - Actualiza su estado (`PUT /baggage/:id`) con un token de empleado.

4. **Desafíos y Soluciones (1 min)**:
   - Menciona problemas como `ECONNREFUSED` (conexión a MongoDB) y `No token provided` (errores de autenticación).
   - Explica cómo los resolviste (configurando MongoDB Atlas, corrigiendo encabezados de token).

5. **Conclusión (1 min)**:
   - Resume las funcionalidades implementadas.
   - Sugiere mejoras futuras (por ejemplo, caché con Redis, interfaz frontend).

### Consejos
- **Practica la demo**: Ejecuta las solicitudes en Postman varias veces para asegurar una presentación fluida.
- **Muestra casos de error**: Demuestra qué pasa con tokens inválidos o datos incorrectos para destacar la robustez.
- **Usa visuales**: Incluye capturas de Postman en tus diapositivas o muestra MongoDB Atlas para enseñar los datos guardados.
- **Sé breve**: Si el tiempo es limitado, enfócate en autenticación, vuelos y reservaciones.

## Solución de Problemas
- **No se proporcionó token**: Asegúrate de que el encabezado `Authorization: Bearer <token>` esté configurado en Postman.
- **Token inválido**: Genera un token nuevo con `POST /auth/login` si el actual ha expirado.
- **404 No Encontrado**: Verifica los `_id` de clientes, vuelos, reservaciones, etc., en MongoDB Atlas.
- **Error 500 del servidor**: Revisa los logs en la consola (`node server.js`) y comparte los detalles para depuración.
- **Correo no enviado**: Confirma que `EMAIL_USER` y `EMAIL_PASS` en `.env` sean correctos y usa una contraseña de aplicación de Gmail.