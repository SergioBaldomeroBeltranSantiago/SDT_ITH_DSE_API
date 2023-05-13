const { testGet, testPost } = require('./helpers');

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