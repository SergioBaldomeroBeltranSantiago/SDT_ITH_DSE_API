const { testGet, testPost, testPut } = require('./helpers');

test('test that /test return patata', (done) => {
    testGet('test', (err,data) => {
        try {
            expect(data).toStrictEqual('patata');
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that POST /test return OK', (done) => {
    const body = {};
    testPost('test', body, (err, res) => {
        try {
            expect(res.body).toStrictEqual('OK');
            done();
        } catch (e) {
            done(e);
        }
    });
});

// Login tests

test('test that /Login rejects non numeric IDs', (done) => {
    const body = {
        "id_number": "testid",
        "password": "password"
    };
    testPost('Login', body, (err, res) => {
        try {
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.id_number).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /Login accepts numerics IDs', (done) => {
    const body = {
        "id_number": "123456",
        "password": "password"
    };
    testPost('Login', body, (err, res) => {
        try {
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /Login rejects empty passwords', (done) => {
    // Arrange
    const body = {
        "id_number": "123456",
        "password": ""
    };
    // Act
    testPost('Login', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.password).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /Login rejects empty id_number', (done) => {
    // Arrange
    const body = {
        "id_number": "",
        "password": "password"
    };
    // Act
    testPost('Login', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.id_number).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /Login rejects empty id_number and password', (done) => {
    // Arrange
    const body = {
        "id_number": "",
        "password": ""
    };
    // Act
    testPost('Login', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.id_number).toBeDefined();
            expect(res.error.password).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /Login rejects negative id_number', (done) => {
    // Arrange
    const body = {
        "id_number": "-2456",
        "password": "password123"
    };
    // Act
    testPost('Login', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.id_number).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /Login accepts 0 as id_number', (done) => {
    // Arrange
    const body = {
        "id_number": "0",
        "password": "password123"
    };
    // Act
    testPost('Login', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

// RestorePassword tests

test('test that /RestorePassword accepts 8-chars matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword accepts 7-chars matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "1234567"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword rejects 9-chars only numbers matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "123456789"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matriculaUser).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword accepts 9-chars with leading C letter matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "C12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword accepts 9-chars with leading m letter matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "m12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword accepts 9-chars with leading b c d or m letter matriculaUser', (done) => {
    // Arrange
    let body = {
        "matriculaUser": "b12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "matriculaUser": "c12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
    
    // Arrange
    body = {
        "matriculaUser": "d12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "matriculaUser": "m12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword accepts 9-chars with leading B C D or M letter matriculaUser', (done) => {
    // Arrange
    let body = {
        "matriculaUser": "B12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "matriculaUser": "C12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
    
    // Arrange
    body = {
        "matriculaUser": "D12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "matriculaUser": "M12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword rejects 9-chars with leading z letter matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "z12345678"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matriculaUser).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword rejects empty matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": ""
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matriculaUser).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword rejects over 9-chars matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "1234567891"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matriculaUser).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword rejects over 9-chars with leading letter matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "M123456789"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matriculaUser).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword accepts 8-chars matriculaUser with leading zeros', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "00000009"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /RestorePassword rejects 9-chars numerics matriculaUser', (done) => {
    // Arrange
    const body = {
        "matriculaUser": "123456789"
    };
    // Act
    testPost('RestorePassword', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matriculaUser).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

// AdminInfo

test('test that /AdminInfo accepts 8-chars loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo accepts 7-chars loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "1234567"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo rejects 9-chars only numbers loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "123456789"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.loginID).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo accepts 9-chars with leading C letter loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "C12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo accepts 9-chars with leading m letter loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "m12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo accepts 9-chars with leading b c d or m letter loginID', (done) => {
    // Arrange
    let body = {
        "loginID": "b12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "loginID": "c12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
    
    // Arrange
    body = {
        "loginID": "d12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "loginID": "m12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo accepts 9-chars with leading B C D or M letter loginID', (done) => {
    // Arrange
    let body = {
        "loginID": "B12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "loginID": "C12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
    
    // Arrange
    body = {
        "loginID": "D12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });

    // Arrange
    body = {
        "loginID": "M12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo rejects 9-chars with leading z letter loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "z12345678"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.loginID).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo rejects empty loginID', (done) => {
    // Arrange
    const body = {
        "loginID": ""
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.loginID).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo rejects over 9-chars loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "1234567891"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.loginID).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo rejects over 9-chars with leading letter loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "M123456789"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.loginID).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo accepts 8-chars loginID with leading zeros', (done) => {
    // Arrange
    const body = {
        "loginID": "00000009"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /AdminInfo rejects 9-chars numerics loginID', (done) => {
    // Arrange
    const body = {
        "loginID": "123456789"
    };
    // Act
    testPost('AdminInfo', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.loginID).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

// EditarUsuario/:id tests

test('test that /EditarUsuario/:id accepts id and user informacion', (done) => {
    // Arrange
    const body = {
        "matricula": "C12345678",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "username1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong id', (done) => {
    // Arrange
    const body = {
        "matricula": "C12345",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "username1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matricula).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong id 2', (done) => {
    const body = {
        "matricula": "H12345678",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "username1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matricula).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects id longer than 9 chars', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "username1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.matricula).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong nombre completo', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "Us3r N@me",
        "contraseña": "username1234",
        "correo_e": "username1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.nombre_Completo).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects empty password', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "",
        "correo_e": "username1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.contraseña).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects empty email', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": ""
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.correo_e).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong email', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "ran@dom$n0me1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.correo_e).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong email 2', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "username1@"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.correo_e).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong email 3', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.correo_e).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

test('test that /EditarUsuario/:id rejects wrong email 3', (done) => {
    const body = {
        "matricula": "C123456789",
        "nombre_Completo": "User Name",
        "contraseña": "username1234",
        "correo_e": "user name1@example.com"
    };
    // Act
    testPut('EditarUsuario/C12345678', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(400);
            expect(res.error.correo_e).toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

// SendSeguimientoEmail tests

test('test that /SendSeguimientoEmail accepts correct data', (done) => {
    const body = {
        "nombre": "User Name",
        "folio": "Nro 4",
        "destinatario": "username1@example.com"
    };
    // Act
    testPost('SendSeguimientoEmail', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});

// UpdateUserInfo tests

test('test that /SendSeguimientoEmail accepts correct data', (done) => {
    const body = {
        "nombre": "User Name",
        "folio": "Nro 4",
        "destinatario": "username1@example.com"
    };
    // Act
    testPost('SendSeguimientoEmail', body, (err, res) => {
        try {
            // Assert
            expect(res.statusCode).toStrictEqual(200);
            expect(res.error).not.toBeDefined();
            done();
        } catch (e) {
            done(e);
        }
    });
});