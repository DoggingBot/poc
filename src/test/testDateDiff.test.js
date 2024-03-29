var helpers = require('../helpers/helpers');


const minuteInMilliseconds = 60000;
const hourInMilliseconds = 3600000;

it("works for really short times", () => {
  dateDiff = helpers.getDateDiffString(100000000 + 60000/2, 100000000);
  expect(dateDiff).toBe("0 minutes");

});

it("works for times less than an hour", () => {
  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds - minuteInMilliseconds), 100000000);
  expect(dateDiff).toBe("59 minutes");

  dateDiff = helpers.getDateDiffString(100000000 + minuteInMilliseconds, 100000000);
  expect(dateDiff).toBe("1 minute");
});

it("works for times less than a day", () => {
  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 3), 100000000);
  expect(dateDiff).toBe("3 hours");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 3) + (minuteInMilliseconds * 25), 100000000);
  expect(dateDiff).toBe("3 hours and 25 minutes");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 12) + (minuteInMilliseconds * 55), 100000000);
  expect(dateDiff).toBe("12 hours and 55 minutes");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 23) + (minuteInMilliseconds * 59), 100000000);
  expect(dateDiff).toBe("23 hours and 59 minutes");
});

it("works for times longer than a day", () => {
  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 24) + (minuteInMilliseconds * 29), 100000000);
  expect(dateDiff).toBe("1 day");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 48) + (minuteInMilliseconds * 34), 100000000);
  expect(dateDiff).toBe("2 days");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 38) + (minuteInMilliseconds * 34), 100000000);
  expect(dateDiff).toBe("1 day and 14 hours");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 25), 100000000);
  expect(dateDiff).toBe("1 day and 1 hour");

  dateDiff = helpers.getDateDiffString(100000000 + (hourInMilliseconds * 24 * 15 + hourInMilliseconds), 100000000);
  expect(dateDiff).toBe("15 days and 1 hour");
});