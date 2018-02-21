/**
 * This file is part of pigalle.transporters.restify
 *
 * Copyright (c) 2018 SAS 9 Février.
 *
 * Distributed under the MIT License (license terms are at http://opensource.org/licenses/MIT).
 *
 */


const net = require('net');
const util = require('util');

const Promise = require('bluebird');

const _ = require('lodash');
const isPromise = require('is-promise');
const restify = require('restify');

const LOG = require('../common/logger')('transporters.restify.RestifyTransporter');

const {TransporterBase} = require('@pigalle/transporters.base');

const defaultOptions = {
  address: '0.0.0.0',
  port: 1789,
  serializer: {
    module: '../serializers/json',
  },
};

class RestifyTransporter extends TransporterBase {

  constructor(options = {}) {
    super('restify', options);
    this._options = _.merge(defaultOptions, options);
    this.address = this._options.address || '127.0.0.1';
    this.port = this._options.port || 1789;
    this.serializer = new (require(this._options.serializer.module))();
  }

  /**
   * Register discovered methods from microservice.
   *
   * @private
   */
  _wrapRegisteredServices() {
    for (let entry of this._servicesRegistry.services.entries()) {
      const name = entry[0], value = entry[1];
      //if (name === 'get') {
      this.connection.get(name, (req, res, next) => {
        this._servicesRegistry.call(name, [req.params.id])
          .then((result) => {
            LOG.debug(result);
            res.send(result);
            next();
          })
          .catch((err) => {
            LOG.error('Error', err);
            res.send(500, err);
            next(err);
          });
      });
      //}
    }
  }

  _listen() {
    return this.connection.listen(this.port, () => {
      console.log('%s listening at %s', this.connection.name, this.connection.url);
    });
  }

  async start() {
    let retval = await this._servicesRegistry.setUp();
    this.connection = restify.createServer();
    this._wrapRegisteredServices();
    return this._listen();
  }

}

module.exports = RestifyTransporter;
