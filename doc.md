# Documentación de la API - Backend Pastelería

Esta documentación describe los endpoints disponibles en la API del backend de la pastelería, incluyendo detalles sobre las rutas, métodos HTTP, parámetros requeridos y ejemplos de respuestas.

---

## **Roles y Autorización**

### **Roles disponibles**
- **ADMINISTRADOR:** Tiene acceso completo a todas las rutas y funcionalidades del sistema.
- **TRABAJADOR:** Tiene acceso a funcionalidades relacionadas con la gestión de productos y categorías.
- **USUARIO:** Tiene acceso limitado a funcionalidades básicas como consultar productos y categorías.

### **Manejo de roles**
- Las rutas protegidas utilizan un sistema de roles basado en JWT para determinar el nivel de acceso.
- El rol del usuario se incluye en el token JWT generado al iniciar sesión.
- Para acceder a rutas protegidas, el cliente debe enviar el token JWT en una cookie httpOnly.

---

## **Endpoints**

### **Autenticación**

#### **1. Login**
- **URL:** `/auth/login`
- **Método:** `POST`
- **Descripción:** Permite a un usuario iniciar sesión en el sistema.
- **Cuerpo de la solicitud (JSON):**
  ```json
  {
    "email": "usuario@correo.com",
    "password": "123456"
  }
  ```
- **Ejemplo de respuesta exitosa (200):**
  ```json
  {
    "message": "Inicio de sesión exitoso!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Errores posibles:**
  - `401 Unauthorized`: Credenciales inválidas.
  - `500 Internal Server Error`: Usuario no encontrado.

#### **2. Registro de usuario**
- **URL:** `/auth/register`
- **Método:** `POST`
- **Descripción:** Permite registrar un nuevo usuario en el sistema.
- **Cuerpo de la solicitud (JSON):**
  ```json
  {
    "name": "Juan Pérez",
    "email": "juan@correo.com",
    "password": "123456",
    "repeatPassword": "123456"
  }
  ```
- **Ejemplo de respuesta exitosa (201):**
  ```json
  {
    "name": "juan",
    "email": "juan@correo.com",
    "role": "USUARIO"
  }
  ```
- **Errores posibles:**
  - `400 Bad Request`: Las contraseñas no coinciden.
  - `409 Conflict`: El usuario ya existe.

#### **3. Registro de trabajador**
- **URL:** `/auth/register/worker`
- **Método:** `POST`
- **Descripción:** Permite registrar un nuevo trabajador en el sistema. Solo accesible para administradores.
- **Requiere autenticación:** Sí (JWT en cookie).
- **Cuerpo de la solicitud (JSON):**
  ```json
  {
    "name": "Carlos López",
    "email": "carlos@correo.com",
    "password": "123456",
    "repeatPassword": "123456"
  }
  ```
- **Ejemplo de respuesta exitosa (201):**
  ```json
  {
    "name": "carlos",
    "email": "carlos@correo.com",
    "role": "TRABAJADOR"
  }
  ```
- **Errores posibles:**
  - `403 Forbidden`: El usuario no tiene permisos para acceder a esta ruta.
  - `409 Conflict`: El usuario ya existe.

#### **4. Logout**
- **URL:** `/auth/logout`
- **Método:** `POST`
- **Descripción:** Permite a un usuario cerrar sesión.
- **Ejemplo de respuesta exitosa (200):**
  ```json
  {
    "message": "Sesion cerrada exitosamente"
  }
  ```

---

### **Productos**

#### **1. Crear un producto**
- **URL:** `/products`
- **Método:** `POST`
- **Descripción:** Permite crear un nuevo producto.
- **Cuerpo de la solicitud (JSON):**
  ```json
  {
    "name": "Pastel de vainilla",
    "description": "Pastel suave de vainilla",
    "price": 12.99,
    "categoryName": "Tortas"
  }
  ```
- **Ejemplo de respuesta exitosa (201):**
  ```json
  {
    "message": "Producto creado correctamente",
    "data": {
      "id": 2,
      "name": "Pastel de vainilla",
      "description": "Pastel suave de vainilla",
      "price": 12.99,
      "imageUrl": null,
      "categoryId": 1
    }
  }
  ```
- **Errores posibles:**
  - `404 Not Found`: Categoría no encontrada.
  - `500 Internal Server Error`: Error al crear el producto.

---

### **Categorías**

#### **1. Obtener todas las categorías**
- **URL:** `/category`
- **Método:** `GET`
- **Descripción:** Devuelve una lista de todas las categorías disponibles.
- **Ejemplo de respuesta exitosa (200):**
  ```json
  [
    {
      "id": 1,
      "name": "Tortas"
    },
    {
      "id": 2,
      "name": "Postres"
    }
  ]
  ```
- **Errores posibles:**
  - `500 Internal Server Error`: Error al obtener las categorías.

#### **2. Crear una categoría**
- **URL:** `/category`
- **Método:** `POST`
- **Descripción:** Permite crear una nueva categoría.
- **Cuerpo de la solicitud (JSON):**
  ```json
  {
    "name": "Galletas"
  }
  ```
- **Ejemplo de respuesta exitosa (201):**
  ```json
  {
    "id": 3,
    "name": "Galletas"
  }
  ```
- **Errores posibles:**
  - `409 Conflict`: La categoría ya existe.
  - `500 Internal Server Error`: Error al crear la categoría.

#### **3. Eliminar una categoría**
- **URL:** `/category/:name`
- **Método:** `DELETE`
- **Descripción:** Permite eliminar una categoría existente.
- **Ejemplo de respuesta exitosa (200):**
  ```json
  {
    "id": 1,
    "name": "Tortas"
  }
  ```
- **Errores posibles:**
  - `404 Not Found`: Categoría no encontrada.
  - `500 Internal Server Error`: Error al eliminar la categoría.
