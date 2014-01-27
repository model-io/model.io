var mongoose = require('mongoose');
var async = require('async');
var expect = require('expect.js');

var user = require('./User');
var Group = user.Group;
var User = user.User;
var ModelIOSchema = require('./Schema');

describe('modelio', function(){
  var Dog, yourGroup, you, member, other, dolly, rondo;

  before(function(done) {
    mongoose.connect('mongodb://localhost/model-io-test');

    var DogSchema = ModelIOSchema.extend({
      name: String,
      color: String
    });
    
    Dog = mongoose.model('Dog', DogSchema);
    
    async.map([Group, User,  Dog], function(collection, done) {
      collection.remove({}, done);
    }, done);
  });

  before(function(done) {

    yourGroup = new Group({ name: 'Group' });

    you = new User({
      name: 'You',
      groups: [yourGroup],
    });

    member = new User({
      name: 'Member',
      groups: [yourGroup],
    });

    other = new User({
      name: 'Other',
      groups: [],
    });
    
    dolly = new Dog({
      name: 'Dolly',
      color: 'black',
      _owner: you,
      _group: yourGroup
    });

    rondo = new Dog({
      name: 'Rondo',
      color: 'black',
      _owner: member,
      _group: yourGroup,
      _read: { all: [], group: ['color'], owner: ['*'] }
    });

    async.map([yourGroup, you, member, other, dolly, rondo], function(thing, done) {
      thing.save(done);
    }, done);
  });

  describe('filter results find by right', function() {
    it('should give dog when searching as owner', function(done) {
      Dog.findWithUser(you, {name: 'Dolly'}, {}, {}, function(err, dogs) {
        expect(dogs.length).to.be(1);
        done();
      });
    });
    it('should give nothing when searching as member', function(done) {
      Dog.findWithUser(member, {name: 'Dolly'}, {}, {}, function(err, dogs) {
        expect(dogs.length).to.be(0);
        done();
      });
    });
    it('should give nothing when searching as other', function(done) {
      Dog.findWithUser(other, {name: 'Dolly'}, {}, {}, function(err, dogs) {
        expect(dogs.length).to.be(0);
        done();
      });
    });
    it('should give two dogs when searching as member of group', function(done) {
      Dog.findWithUser(you, {}, {}, {}, function(err, dogs) {
        expect(dogs.length).to.be(2);
        done();
      });
    });
  });
  describe('filter results attributes find by right', function() {
    it('should give only information according rights', function(done) {
      Dog.findWithUser(you, {}, {}, {}, function(err, dogs) {
        expect(dogs.length).to.be(2);
        dogs.forEach(function(dog) {
          if (dog._owner == you.id) {
            expect(dog).to.have.property('name');
            expect(dog).to.have.property('color');
          } else {
            expect(dog).to.not.have.property('name');
            expect(dog).to.have.property('color');
          }
        });
        done();
      });
    });
  });
});
