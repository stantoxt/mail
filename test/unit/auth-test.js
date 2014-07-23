define(function(require) {
    'use strict';

    var Auth = require('js/bo/auth'),
        OAuth = require('js/util/oauth'),
        PGP = require('js/crypto/pgp'),
        DeviceStorageDAO = require('js/dao/devicestorage-dao'),
        expect = chai.expect;

    describe('Auth unit tests', function() {
        // Constancts
        var EMAIL_ADDR_DB_KEY = 'emailaddress';
        var USERNAME_DB_KEY = 'username';
        var REALNAME_DB_KEY = 'realname';
        var PASSWD_DB_KEY = 'password';
        var PROVIDER_DB_KEY = 'provider';
        var IMAP_DB_KEY = 'imap';
        var SMTP_DB_KEY = 'smtp';
        // SUT
        var auth;

        // Dependencies
        var storageStub, oauthStub, pgpStub;

        // test data
        var emailAddress = 'bla@blubb.com';
        var password = 'passwordpasswordpassword';
        var encryptedPassword = 'pgppasswordpgppassword';
        var oauthToken = 'tokentokentokentoken';
        var provider = 'gmail';
        var realname = 'Bla Blubb';
        var username = 'bla';
        var imap = {
            host: 'mail.blablubb.com',
            port: 123,
            secure: true,
            ca: 'PEMPEMPEMPEMPEMPEMPEMPEMPEMPEM'
        };
        var smtp = {
            host: 'mail.blablubb.com',
            port: 456,
            secure: true,
            ca: 'PEMPEMPEMPEMPEMPEMPEMPEMPEMPEM'
        };

        beforeEach(function() {
            storageStub = sinon.createStubInstance(DeviceStorageDAO);
            oauthStub = sinon.createStubInstance(OAuth);
            pgpStub = sinon.createStubInstance(PGP);
            auth = new Auth(storageStub, oauthStub, pgpStub);
        });

        describe('#getCredentials', function() {
            it('should load credentials and retrieve credentials from cfg', function(done) {
                storageStub.listItems.withArgs(EMAIL_ADDR_DB_KEY, 0, null).yieldsAsync(null, [emailAddress]);
                storageStub.listItems.withArgs(PASSWD_DB_KEY, 0, null).yieldsAsync(null, [encryptedPassword]);
                storageStub.listItems.withArgs(PROVIDER_DB_KEY, 0, null).yieldsAsync(null, [provider]);
                storageStub.listItems.withArgs(USERNAME_DB_KEY, 0, null).yieldsAsync(null, [username]);
                storageStub.listItems.withArgs(REALNAME_DB_KEY, 0, null).yieldsAsync(null, [realname]);
                storageStub.listItems.withArgs(IMAP_DB_KEY, 0, null).yieldsAsync(null, [imap]);
                storageStub.listItems.withArgs(SMTP_DB_KEY, 0, null).yieldsAsync(null, [smtp]);
                pgpStub.decrypt.withArgs(encryptedPassword, undefined).yields(null, password);

                auth.getCredentials(function(err, cred) {
                    expect(err).to.not.exist;

                    expect(auth.provider).to.equal(provider);
                    expect(auth.emailAddress).to.equal(emailAddress);
                    expect(auth.password).to.equal(password);

                    expect(cred.imap.host).to.equal(imap.host);
                    expect(cred.imap.port).to.equal(imap.port);
                    expect(cred.imap.secure).to.equal(imap.secure);
                    expect(cred.imap.ca).to.equal(imap.ca);
                    expect(cred.imap.auth.user).to.equal(username);
                    expect(cred.imap.auth.pass).to.equal(password);

                    expect(cred.smtp.host).to.equal(smtp.host);
                    expect(cred.smtp.port).to.equal(smtp.port);
                    expect(cred.smtp.secure).to.equal(smtp.secure);
                    expect(cred.smtp.ca).to.equal(smtp.ca);
                    expect(cred.smtp.auth.user).to.equal(username);
                    expect(cred.smtp.auth.pass).to.equal(password);

                    expect(storageStub.listItems.callCount).to.equal(7);
                    expect(pgpStub.decrypt.calledOnce).to.be.true;

                    done();
                });
            });
        });

        describe('#setCredentials', function() {
            it('should set the credentials', function() {
                auth.setCredentials({
                    provider: 'albhsvadlbvsdalbsadflb',
                    emailAddress: emailAddress,
                    username: username,
                    realname: realname,
                    password: password,
                    imap: imap,
                    smtp: smtp
                });

                expect(auth.provider).to.equal('albhsvadlbvsdalbsadflb');
                expect(auth.emailAddress).to.equal(emailAddress);
                expect(auth.username).to.equal(username);
                expect(auth.realname).to.equal(realname);
                expect(auth.password).to.equal(password);
                expect(auth.smtp).to.equal(smtp);
                expect(auth.imap).to.equal(imap);
                expect(auth.credentialsDirty).to.be.true;
            });

        });

        describe('#storeCredentials', function() {
            it('should persist ALL the things!', function(done) {
                auth.credentialsDirty = true;
                auth.emailAddress = emailAddress;
                auth.username = username;
                auth.realname = realname;
                auth.password = password;
                auth.smtp = smtp;
                auth.imap = imap;
                auth.provider = provider;

                storageStub.storeList.withArgs([encryptedPassword], PASSWD_DB_KEY).yieldsAsync();
                storageStub.storeList.withArgs([emailAddress], EMAIL_ADDR_DB_KEY).yieldsAsync();
                storageStub.storeList.withArgs([provider], PROVIDER_DB_KEY).yieldsAsync();
                storageStub.storeList.withArgs([username], USERNAME_DB_KEY).yieldsAsync();
                storageStub.storeList.withArgs([realname], REALNAME_DB_KEY).yieldsAsync();
                storageStub.storeList.withArgs([imap], IMAP_DB_KEY).yieldsAsync();
                storageStub.storeList.withArgs([smtp], SMTP_DB_KEY).yieldsAsync();
                pgpStub.encrypt.withArgs(password).yields(null, encryptedPassword);

                auth.storeCredentials(function(err) {
                    expect(err).to.not.exist;

                    expect(storageStub.storeList.callCount).to.equal(7);
                    expect(pgpStub.encrypt.calledOnce).to.be.true;

                    done();
                });
            });
        });

        describe('#getOAuthToken', function() {
            it('should fetch token with known email address', function(done) {
                auth.emailAddress = emailAddress;
                oauthStub.getOAuthToken.withArgs(emailAddress).yieldsAsync(null, oauthToken);

                auth.getOAuthToken(function(err) {
                    expect(err).to.not.exist;
                    expect(auth.emailAddress).to.equal(emailAddress);
                    expect(auth.oauthToken).to.equal(oauthToken);

                    expect(oauthStub.getOAuthToken.calledOnce).to.be.true;

                    done();
                });
            });

            it('should fetch token with unknown email address', function(done) {
                oauthStub.getOAuthToken.withArgs(undefined).yieldsAsync(null, oauthToken);
                oauthStub.queryEmailAddress.withArgs(oauthToken).yieldsAsync(null, emailAddress);

                auth.getOAuthToken(function(err) {
                    expect(err).to.not.exist;
                    expect(auth.emailAddress).to.equal(emailAddress);
                    expect(auth.oauthToken).to.equal(oauthToken);

                    expect(oauthStub.getOAuthToken.calledOnce).to.be.true;
                    expect(oauthStub.queryEmailAddress.calledOnce).to.be.true;

                    done();
                });
            });

            it('should fail when email address fetch fails', function(done) {
                oauthStub.getOAuthToken.yieldsAsync(null, oauthToken);
                oauthStub.queryEmailAddress.yieldsAsync(new Error());

                auth.getOAuthToken(function(err) {
                    expect(err).to.exist;
                    expect(auth.emailAddress).to.not.exist;
                    expect(auth.oauthToken).to.not.exist;

                    expect(oauthStub.getOAuthToken.calledOnce).to.be.true;
                    expect(oauthStub.queryEmailAddress.calledOnce).to.be.true;

                    done();
                });
            });

            it('should fail when oauth fetch fails', function(done) {
                oauthStub.getOAuthToken.yieldsAsync(new Error());

                auth.getOAuthToken(function(err) {
                    expect(err).to.exist;
                    expect(auth.emailAddress).to.not.exist;
                    expect(auth.oauthToken).to.not.exist;

                    expect(oauthStub.getOAuthToken.calledOnce).to.be.true;
                    expect(oauthStub.queryEmailAddress.called).to.be.false;

                    done();
                });
            });
        });

        describe('#_loadCredentials', function() {
            it('should work', function(done) {
                storageStub.listItems.withArgs(EMAIL_ADDR_DB_KEY, 0, null).yieldsAsync(null, [emailAddress]);
                storageStub.listItems.withArgs(PASSWD_DB_KEY, 0, null).yieldsAsync(null, [encryptedPassword]);
                storageStub.listItems.withArgs(PROVIDER_DB_KEY, 0, null).yieldsAsync(null, [provider]);
                storageStub.listItems.withArgs(USERNAME_DB_KEY, 0, null).yieldsAsync(null, [username]);
                storageStub.listItems.withArgs(REALNAME_DB_KEY, 0, null).yieldsAsync(null, [realname]);
                storageStub.listItems.withArgs(IMAP_DB_KEY, 0, null).yieldsAsync(null, [imap]);
                storageStub.listItems.withArgs(SMTP_DB_KEY, 0, null).yieldsAsync(null, [smtp]);

                auth._loadCredentials(function(err) {
                    expect(err).to.not.exist;
                    expect(auth.emailAddress).to.equal(emailAddress);
                    expect(auth.password).to.equal(encryptedPassword);
                    expect(auth.provider).to.equal(provider);
                    expect(auth.imap).to.equal(imap);
                    expect(auth.smtp).to.equal(smtp);
                    expect(auth.username).to.equal(username);
                    expect(auth.realname).to.equal(realname);

                    expect(auth.passwordNeedsDecryption).to.be.true;

                    expect(storageStub.listItems.callCount).to.equal(7);

                    done();
                });
            });

            it('should fail', function(done) {
                storageStub.listItems.yieldsAsync(new Error());

                auth._loadCredentials(function(err) {
                    expect(err).to.exist;
                    expect(auth.emailAddress).to.not.exist;
                    expect(auth.password).to.not.exist;
                    expect(auth.provider).to.not.exist;
                    expect(auth.imap).to.not.exist;
                    expect(auth.smtp).to.not.exist;
                    expect(auth.username).to.not.exist;
                    expect(auth.realname).to.not.exist;

                    expect(storageStub.listItems.calledOnce).to.be.true;

                    done();
                });
            });
        });

        describe('#handleCertificateUpdate', function() {
            var storeCredentialsStub;
            var dummyCert = 'cert';

            function onConnectDummy() {}

            beforeEach(function() {
                storeCredentialsStub = sinon.stub(auth, 'storeCredentials');
            });

            it('should work for Trust on first use', function(done) {
                auth.imap = {};
                storeCredentialsStub.yields();

                function callback(err) {
                    expect(err).to.not.exist;
                    expect(storeCredentialsStub.callCount).to.equal(1);
                    done();
                }
                auth.handleCertificateUpdate('imap', onConnectDummy, callback, dummyCert);
            });

            it('should work for stored cert', function() {
                auth.imap = {
                    ca: dummyCert
                };
                storeCredentialsStub.yields();

                auth.handleCertificateUpdate('imap', onConnectDummy, onConnectDummy, dummyCert);
                expect(storeCredentialsStub.callCount).to.equal(0);
            });

            it('should work for pinned cert', function(done) {
                auth.imap = {
                    ca: 'other',
                    pinned: true
                };
                storeCredentialsStub.yields();

                function callback(err) {
                    expect(err).to.exist;
                    expect(err.message).to.exist;
                    expect(storeCredentialsStub.callCount).to.equal(0);
                    done();
                }
                auth.handleCertificateUpdate('imap', onConnectDummy, callback, dummyCert);
            });

            it('should work for updated cert', function(done) {
                auth.imap = {
                    ca: 'other'
                };
                storeCredentialsStub.yields();

                function callback(err) {
                    if (err && err.callback) {
                        expect(err).to.exist;
                        expect(err.message).to.exist;
                        expect(storeCredentialsStub.callCount).to.equal(0);
                        err.callback(true);
                    } else {
                        expect(storeCredentialsStub.callCount).to.equal(1);
                        done();
                    }
                }

                function onConnect(callback) {
                    callback();
                }

                auth.handleCertificateUpdate('imap', onConnect, callback, dummyCert);
            });
        });
    });
});