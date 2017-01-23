'use strict'

const express = require('express'),
      Portal = require('./../model/portals'),
      PortalCrtl = require('./../controllers/portals');

let router = express.Router();

router.route('/portals')
  .get(PortalCrtl.findAllPortals)
  .post(PortalCrtl.addPortal);

router.route('/portals/:slug')
  .get(PortalCrtl.findBySlug)
  .put(PortalCrtl.updatePortal)
  .delete(PortalCrtl.deletePortal);


// router.route('/portals')
//   .get((req, res) => {
//     Portal.find((err, portals) => {
//       if (err) {
//         return res.send(err);
//       }
//       res.json(portals);
//     });
//   })
//   .post((req, res) => {
//     let portal = new Portal(req.body);
//
//     portal.save((err) => {
//       if (err) {
//         return res.send(err);
//       }
//
//       res.send({message: 'portal agregado'});
//     });
//   });

module.exports = router;
