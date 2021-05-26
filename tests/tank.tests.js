//drunktank.js unit tests
//Work in progress
const drunktank = require('../drunktank.js');

//modules to mock
var persistence = require('../persistence.js');
var helpers = require( '../helpers.js');
var messaging = require( '../messaging.js');
var config = require('../config.js')


function injectMocks() {
  jest.mock('../persistence.js');
  jest.mock('../helpers.js');
  jest.mock('../messaging.js');
  jest.mock('../config.js');

  drunktank.injectDependencies(config, persistence, messaging, helpers);
}


test('testTankUser', () => {
  injectMocks();

  drunktank.getOldRoles = jest.fn();

  var guild = {
    roles: {
      fetch: function(drunktankrole) {
        return "2Drunk2Party";
      }
    }
  }

  var tankedMember = {
    roles: {
      set: function(p1, p2) {
        return Promise.resolve();
      }
    }
  }

  await drunktank.tankUser(guild, tankedMember, "test author", "test reason", "test duration", "test uom");

  expect(persistence.saveTanking).toHaveBeenCalledWith("test author", guild, "test reason", undefined, "test duration", "test uom");
  expect(drunktank.getOldRoles).toHaveBeenCalledWith(tankedMember);
  expect(messaging.log_blue_tank_msg).toHaveBeenCalledWith("test author", tankedMember, "test reason");
  expect(messaging.write_to_channel).toHaveBeenCalledWith(guild, config.logChannel, undefined);

});