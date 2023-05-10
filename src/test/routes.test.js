const callback = require('./routes');

test('test that it return patata', (done) => {
    callback('http://localhost:9450/test', async (err,data) => {
        try {
            await expect(data).toStrictEqual('patata');
            done();
        } catch (e) {
            done(e);
        }
    })
})