'use strict';

/**
 * Validate the correctnes of portal form
 */
exports.validatePortalForm = (req, res, next) => {
  const validations = {
    'title': {
      notEmpty: true,
      errorMessage: 'Título es un campo requerido'
    },
    'url': {
      notEmpty: true,
      isURL: {
          errorMessage: 'Url no contiene una url válida. '
      },
      errorMessage: 'Url es un campo requerido.'
    },
    'author': {
      notEmpty: true,
      errorMessage: 'Autor es un campo requerido.'
    },
    'publisher_clasification': {
      notEmpty: true,
      errorMessage: 'Tipo de autor es un campo requerido.'
    },
    'description': {
      notEmpty: true,
      errorMessage: 'Descripción es un campo requerido.'
    },
    'country': {
      notEmpty: true,
      errorMessage: 'País es un campo requerido.'
    },
    'city': {
      notEmpty: true,
      errorMessage: 'Ciudad es un campo requerido.'
    },
    'lenguage': {
      notEmpty: true,
      errorMessage: 'Lenguaje es un campo requerido.'
    },
    'status': {
      notEmpty: true,
      errorMessage: 'Estado es un campo requerido.'
    },
    'plataform': {
      notEmpty: true,
      errorMessage: 'Plataforma es un campo requerido.'
    },
    'api_endpoint': {
      notEmpty: true,
      isURL: {
          errorMessage: 'Url de API no contiene una url válida. '
      },
      errorMessage: 'Url de API es un campo requerido.'
    },
    'api_type': {
      notEmpty: true,
      errorMessage: 'Tipo de Api es un campo requerido.'
    },
    'owner': {
      optional: true,
    }
  }
  req.checkBody(validations);

  req.sanitize('title').escape();
  req.sanitize('author').escape();
  req.sanitize('publisher_clasification').escape();
  req.sanitize('description').escape();
  req.sanitize('country').escape();
  req.sanitize('city').escape();
  req.sanitize('lenguage').escape();
  req.sanitize('status').escape();
  req.sanitize('plataform').escape();
  req.sanitize('api_type').escape();
  req.sanitize('owner').escape();

  req.getValidationResult().then( (result) => {
    if (result.isEmpty()) {
      return next();
    }
    const errors = result.mapped();
    req.flash('formErr', errors);
    res.redirect('back');
  });
};

/**
 * Validate the correctnes of usser form
 */
exports.validateUserForm = (req, res, next) => {
  const validations = {
    'name': {
      notEmpty: true,
      errorMessage: 'Nombre es un campo requerido'
    },
    'email': {
      notEmpty: true,
      isEmail: {
          errorMessage: 'E-mail no contiene un e-mail válido. '
      },
      errorMessage: 'E-mail es un campo requerido.'
    },
    'password': {
      notEmpty: true,
      isLength: {
        options: [{ min: 4 }],
        errorMessage: 'Debe ser de por lo menos 4 caractéres.'
      },
      isAlphanumeric: {
        errorMessage: 'Solo se permiten números y letras'
      },
      errorMessage: 'Contraseña es un campo requerido.'
    },
    'role': {
      notEmpty: true,
      errorMessage: 'Rol es un campo requerido.'
    }
  }
  req.checkBody(validations);

  req.sanitize('name').escape();
  req.sanitize('password').escape();
  req.sanitize('role').escape();

  req.getValidationResult().then( (result) => {
    if (result.isEmpty()) {
      return next();
    }
    const errors = result.mapped();
    req.flash('formErr', errors);
    res.redirect('back');
  });
};

/**
 * Validate the correctnes of contact form
 */
exports.validateContactForm = (req, res, next) => {
  const validations = {
    'name': {
      notEmpty: true,
      errorMessage: 'Nombre es un campo requerido'
    },
    'email': {
      optional: true,
      isEmail: {
          errorMessage: 'E-mail no contiene un e-mail válido. '
      },
      errorMessage: 'E-mail es un campo requerido.'
    },
    'subject': {
      notEmpty: true,
      errorMessage: 'Asunto es un campo requerido.'
    },
    'message': {
      notEmpty: true,
      errorMessage: 'Mensaje es un campo requerido.'
    }
  }
  req.checkBody(validations);

  req.sanitize('name').escape();
  req.sanitize('email').escape();
  req.sanitize('subject').escape();
  req.sanitize('message').escape();

  req.getValidationResult().then( (result) => {
    if (result.isEmpty()) {
      return next();
    }
    const errors = result.mapped();
    req.flash('formErr', errors);
    res.redirect('back');
  });
};

/**
 * Validate the correctnes of sugerir-portal form
 */
exports.validateSuggestPortalForm = (req, res, next) => {
  const validations = {
    'name': {
      notEmpty: true,
      errorMessage: 'Nombre es un campo requerido'
    },
    'url': {
      notEmpty: true,
      isURL: {
          errorMessage: 'Url del portal no contiene una url válida. '
      },
      errorMessage: 'Url del portal es un campo requerido.'
    },
    'exp-datos-abiertos': {
      notEmpty: true,
      errorMessage: 'Este campor es requerido.'
    },
    'exp-gob-abiertos': {
      notEmpty: true,
      errorMessage: 'Este campor es requerido.'
    },
    'exp-transparencia': {
      notEmpty: true,
      errorMessage: 'Este campor es requerido.'
    },
    'ofrece-descarga': {
      notEmpty: true,
      errorMessage: 'Este campor es requerido.'
    }
  }
  req.checkBody(validations);

  req.sanitize('name').escape();
  req.sanitize('url').escape();

  req.getValidationResult().then( (result) => {
    if (result.isEmpty()) {
      return next();
    }
    const errors = result.mapped();
    req.flash('formErr', errors);
    res.redirect('back');
  });
};
