// Custom validators
import { body } from "express-validator";

const matriculaValidator = (value, { req, location, path }) => {
    if (value.length <= 8) {
        if (body('path').isNumeric())
        {
            return true;
        }  else {
            throw Error('Formato de matricula invalida para 8 caracteres de longitud');
        }
    } else {

    }
}

// body('id_number').if(body('id_number').isLength({min: 0, max: 8})).isInt({min: 0, allow_leading_zeroes: true});
// body('id_number').if(body('id_number').isLength({min: 9, max: 9})).matches(/^[bcdmBCDM][0-9]{8,8}$/);

