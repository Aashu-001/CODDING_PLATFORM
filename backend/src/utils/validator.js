const validator = require("validator");

// req.body 

const validate = (data) => {

    const mandatoryField = ['firstName', "emailId", 'password'];

    const IsAllowed = mandatoryField.every((k) => Object.keys(data).includes(k));

    if (!IsAllowed)
        throw new Error("Some Field Missing");

    if (!validator.isEmail(data.emailId))
        throw new Error("Invalid Email");

    if (!validator.isStrongPassword(data.password, { minLength: 8, minLowercase: 0, minUppercase: 0, minNumbers: 1, minSymbols: 0 }))
        throw new Error("Password must be at least 8 characters long and include at least one number.");
}

module.exports = validate;
