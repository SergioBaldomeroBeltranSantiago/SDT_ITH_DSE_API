var rp = require('request-promise');

// module.exports = (url, cb) => {
//     if (url != 'http://localhost:9450/test'){
//         cb(Error('Wrong URL'));
//     } else {
//         rp(url).then(
//             data => {
//                 cb(null, data);
//             }).catch( err => {
//                 cb(err);
//             })
//     }
// }

exports.testPost = (endpoint, body, cb) => {
    const url = 'http://localhost:9450/' + endpoint;
    const options = {
        method: 'POST',
        uri: url,
        body: body,
        json: true // Automatically stringifies the body to JSON
    };

    rp(options).then(data => cb(null, data)).catch( error => cb(error));
}

exports.testGet = (endpoint, cb) => {
    const url = 'http://localhost:9450/' + endpoint;
        rp(url).then(
            data => {
                cb(null, data);
            }).catch( err => {
                cb(err);
            })
}

// module.exports = (endpoint, body, cb) => {
//     const url = 'http://localhost:9450/' + endpoint;
//     const options = {
//         method: 'POST',
//         uri: url,
//         body: body,
//         json: true // Automatically stringifies the body to JSON
//     };

//     rp(options).then(data => cb(null, data)).catch( error => cb(error));
// }