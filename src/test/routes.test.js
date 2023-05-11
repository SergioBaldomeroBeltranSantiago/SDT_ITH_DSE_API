const testGet = require('./routes').testGet
const testPost = require('./routes').testPost

test('test that /test return patata', (done) => {
    testGet('test', (err,data) => {
        try {
            expect(data).toStrictEqual('patata');
            done();
        } catch (e) {
            done(e);
        }
    })
});

test('test that POST /test return OK', (done) => {
    body = {}
    testPost('test', body, (err, data) => {
        try {
            expect(data).toStrictEqual('OK');
            done();
        } catch (e) {
            done(e);
        }
    })
});