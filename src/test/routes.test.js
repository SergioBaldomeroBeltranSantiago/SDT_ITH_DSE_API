const callback = require('./routes');

// test('test that /test return patata', (done) => {
//     callback('http://localhost:9450/test', (err,data) => {
//         try {
//             expect(data).toStrictEqual('patata');
//             done();
//         } catch (e) {
//             done(e);
//         }
//     })
// });

test('test that POST /test return OK', (done) => {
    body = {}
    callback('test', body, (err, data) => {
        try {
            expect(data).toStrictEqual('OK');
            done();
        } catch (e) {
            done(e);
        }
    })
});