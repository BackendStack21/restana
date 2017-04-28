const ana = require('./index')({});
const expect = require("chai").expect;
const request = require('supertest');
let server;

describe('Ana Web Framework', () => {
    it('initialize', async() => {
        ana.get('/pets/:id', function (req, res) {
            res.body = this[req.params.id];
            res.send(200);
        }, [{
            name: 'Happy Cat'
        }]);

        ana.get('/error', (req, res, ctx) => {
            throw new Error('error');
        });

        server = await ana.start();
    });

    it('request pet', async() => {
        await request(server).get('/pets/0').expect(200)
            .then(response => {
                expect(response.body.name).to.equal('Happy Cat')
            });
    });

    it('request error', async() => {
        await request(server).get('/error').expect(500)
            .then(response => {
                expect(response.body.message).to.equal('error')
            });
    });

    it('request 404', async() => {
        await request(server).get('/sdsdfsf').expect(404);
    });

    it('routes', async() => {
        expect(ana.routes().includes('[GET]/pets/:id')).to.equal(true)
    });

    it('adding 500 middleware', async() => {
        ana.use((req, res, next) => {
            res.statusCode = 500;

            return next();
        });
    });

    it('call /pets/0 should fail after 500 middleware', async() => {
        await request(server).get('/pets/0').expect(500);
    });

    it('close', async() => {
        await ana.close();
    });
});