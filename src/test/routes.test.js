const callback = require('./routes');

test('test that it return patata', (done) => {
    callback('http://localhost:9450/test', (err,data) => {
        try {
            expect(data).toStrictEqual('patata');
            done();
        } catch (e) {
            done(e);
        }
    })
})