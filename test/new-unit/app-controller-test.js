define(function(require) {
    'use strict';

    var controller = require('js/app-controller'),
        EmailDAO = require('js/dao/email-dao'),
        $ = require('jquery'),
        expect = chai.expect;

    var appControllerTest = {
        user: 'test@exmaple.com',
        passphrase: 'asdf'
    };

    describe('App Controller unit tests', function() {

        beforeEach(function() {
            sinon.stub(controller, 'login', function(userId, password, token, callback) {
                controller._emailDao = sinon.createStubInstance(EmailDAO);
                callback();
            });

            sinon.stub($, 'get');
            sinon.stub($, 'ajax').yieldsTo('success', {
                email: appControllerTest.user
            });

            window.chrome = window.chrome || {};
            window.chrome.identity = window.chrome.identity || {};
            if (typeof window.chrome.identity.getAuthToken !== 'function') {
                window.chrome.identity.getAuthToken = function() {};
            }
            sinon.stub(window.chrome.identity, 'getAuthToken');
            window.chrome.identity.getAuthToken.yields('token42');
        });

        afterEach(function() {
            controller.login.restore();
            $.get.restore();
            $.ajax.restore();
            window.chrome.identity.getAuthToken.restore();
        });

        describe('start', function() {
            it('should not explode', function(done) {
                $.get.yields('<div></div>');
                controller.start(function(err) {
                    expect($.get.called).to.be.true;
                    expect(err).to.not.exist;
                    done();
                });
            });
        });

        describe('execute', function() {
            describe('login', function() {
                it('should work', function(done) {
                    controller.execute('login', {
                        password: appControllerTest.passphrase
                    }, function(resArgs) {
                        expect(resArgs.err).to.not.exist;
                        expect(resArgs.userId).to.equal(appControllerTest.user);
                        expect($.ajax.called).to.be.true;
                        expect(window.chrome.identity.getAuthToken.called).to.be.true;
                        done();
                    });
                });
            });

            describe('sendEmail', function() {
                it('should work', function(done) {
                    controller._emailDao.smtpSend.yields();
                    controller.execute('sendEmail', {
                        password: appControllerTest.passphrase
                    }, function(resArgs) {
                        expect(resArgs.err).to.not.exist;
                        expect(controller._emailDao.smtpSend.called).to.be.true;
                        done();
                    });
                });
            });
        });

    });

});