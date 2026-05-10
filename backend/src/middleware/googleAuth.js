const passport = require('passport');
const prisma = require('../controler/prisma');

// Google OAuth disabled - using only local authentication
const hasGoogleCreds = false;

// Minimal serialize/deserialize (not used with session:false but required by passport)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
module.exports.hasGoogleCreds = hasGoogleCreds;
