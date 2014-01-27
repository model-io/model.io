var mongoose = require('mongoose');
var async = require('async');
var expect = require('expect.js');

var user = require('./User');
var Group = user.Group;
var User = user.User;
var ModelIOSchema = require('./Schema');

describe('modelio', function(){
  var Dog, inGroup, outGroup, you, member, other, admin, dolly, rondo, celina;

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

    inGroup = new Group({ name: 'InGroup' });
    outGroup = new Group({ name: 'OutGroup' });

    you = new User({
      name: 'You',
      groups: [inGroup],
    });

    member = new User({
      name: 'Member',
      groups: [inGroup],
    });

    other = new User({
      name: 'Other',
      groups: [outGroup],
    });

    admin = new User({
      name: 'Admin',
      groups: [inGroup, outGroup],
    });
    
    dolly = new Dog({
      name: 'Dolly',
      color: 'black',
      _owner: you,
      _group: inGroup
    });

    rondo = new Dog({
      name: 'Rondo',
      color: 'brown',
      _owner: member,
      _group: inGroup,
      _read: { all: [], group: ['color'], owner: ['*'] }
    });

    celina = new Dog({
      name: 'Celina',
      color: 'white',
      _owner: other,
      _group: outGroup,
      _read: { all: ['color'], group: [], owner: ['*'] }
    });

    async.map([inGroup, outGroup, you, member, other, admin, dolly, rondo, celina], function(thing, done) {
      thing.save(done);
    }, done);
  });

  describe('filter results find by permissions', function() {
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
        expect(dogs.length).to.be(3);
        done();
      });
    });
  });
  describe('filter results attributes find by permissions', function() {
    it('should give only information according permissions', function(done) {
      Dog.findWithUser(you, {}, {}, {}, function(err, dogs) {
        expect(dogs.length).to.be(3);
        dogs.forEach(function(dog) {
          expect(dog).to.be.a(Dog);
          if (dog._owner == you.id) {
            expect(dog.name).to.be('Dolly');
            expect(dog.color).to.be('black');
          } else {
            expect(dog.name).to.be(undefined);
            expect(dog.color).to.match(/brown|white/);
          }
        });
        done();
      });
    });
  });
});
