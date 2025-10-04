const assert = require('assert');
const request = require('supertest');  
const app = require('../app.js'); 

describe('App Unit Tests', function() {
  it('should return Hello World on GET /', function(done) {
    request(app)
      .get('/')
      .expect(200)
      .expect('Hello World!')
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });

  it('basic assertion test', function() {
    assert.strictEqual(1 + 1, 2, 'Math works!');
  });
});