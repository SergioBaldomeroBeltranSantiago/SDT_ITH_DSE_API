var rp = require('request-promise');

exports.testGet = (endpoint, cb) => {
    const url = 'http://localhost:9450/' + endpoint;
        rp(url).then(
            data => {
                cb(null, data);
            }).catch( err => {
                cb(err);
            })
}

exports.testPost = (endpoint, body, cb) => {
    const url = 'http://localhost:9450/' + endpoint;
    const options = {
        method: 'POST',
        uri: url,
        body: body,
        json: true, // Automatically stringifies the body to JSON,
        resolveWithFullResponse: true
    };

    rp(options).then(res => cb(null, res)).catch( error => cb(null, error));
}

exports.testPut = (endpoint, body, cb) => {
    const url = 'http://localhost:9450/' + endpoint;
    const options = {
        method: 'PUT',
        uri: url,
        body: body,
        json: true, // Automatically stringifies the body to JSON,
        resolveWithFullResponse: true
    };

    rp(options).then(res => cb(null, res)).catch( error => cb(null, error));
}