'use strict'

const express = require('express'),
      portalCrtl = require('./../controllers/portals');

let router = express.Router();

router.route('/portals')
  .get(portalCrtl.findAllPortals)
  .post(portalCrtl.addPortal);

router.route('/portals/add')
  .get(portalCrtl.renderAddView);

router.route('/portals/:slug')
  .get(portalCrtl.findBySlug)
  .put(portalCrtl.updatePortal)
  .delete(portalCrtl.deletePortal);

router.route('/portals/:slug/edit')
  .get(portalCrtl.renderEditView);

module.exports = router;
