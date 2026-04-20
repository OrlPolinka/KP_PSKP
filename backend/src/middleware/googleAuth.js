const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../controler/prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here';

if (hasGoogleCreds) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        passReqToCallback: false,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
                return done(new Error('Email не получен от Google'), null);
            }

            let user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
                user = await prisma.user.create({
                    data: {
                        email,
                        password: randomPassword,
                        fullName: profile.displayName || email.split('@')[0],
                        role: 'client',
                        isActive: true,
                    }
                });
            }

            if (!user.isActive) {
                return done(null, false, { message: 'Аккаунт заблокирован' });
            }

            return done(null, user);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));
} else {
    console.log('Google OAuth: credentials not configured, skipping strategy registration');
}

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
