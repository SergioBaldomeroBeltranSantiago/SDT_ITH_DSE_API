var rp = require('request-promise');

module.exports = (url, cb) => {
    if (url != 'http://localhost:9450/test'){
        cb(Error('Wrong URL'));
    } else {
        rp(url).then(
            data => {
                cb(null, data);
            }).catch( err => {
                cb(err);
            })
    }
}