const assert = require('assert');
const request = require('supertest');

// create a simple test for Express application
const express = require('express');
const testApp = express();

// copy the original application routes
testApp.get('/', (req, res) => res.send('Hello World!'));

describe('simple unit test', function() {
  it('should return Hello World!', function(done) {
    request(testApp)
      .get('/')
      .expect(200)
      .expect('Hello World!')
      .end(done);
  });

  it('basic mathematical operation test', function() {
    assert.strictEqual(1 + 1, 2, '1+1=2');
  });

  it('test non-existent route should return 404', function(done) {
    request(testApp)
      .get('/not-exist')
      .expect(404)
      .end(done);
  });
});