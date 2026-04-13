import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { sql } from "@/lib/db/db";

// We'll use a simple guest ID generator for guest logins
const generateGuestId = () => `guest_${Math.random().toString(36).substr(2, 9)}`;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-at-least-32-characters-long",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Fetch user from DB
        const result = await sql`SELECT * FROM users WHERE email = ${credentials.email}`;
        const user = result.rows[0];

        if (user && user.password === credentials.password) { // In prod, use bcrypt.compare
          return { id: user.id.toString(), name: user.name, email: user.email, image: user.image };
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        const guestId = generateGuestId();
        const guestName = `Guest_${guestId.slice(-4)}`;
        
        // Create a guest user entry in DB to track balance
        const result = await sql`
          INSERT INTO users (name, email, image, provider)
          VALUES (${guestName}, ${guestId + "@guest.local"}, null, 'guest')
          RETURNING id, name, email
        `;
        const newUser = result.rows[0];

        // Initialize profile
        await sql`
          INSERT INTO user_profiles (user_id, balance, avatar_url)
          VALUES (${newUser.id}, 1000.00, '/avatars/default.png')
          ON CONFLICT (user_id) DO NOTHING
        `;

        return { id: newUser.id.toString(), name: newUser.name, email: newUser.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google" && profile?.email) {
          // Upsert user on Google sign-in
          const result = await sql`
            INSERT INTO users (name, email, image, provider)
            VALUES (${user.name}, ${user.email}, ${user.image}, 'google')
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name, image = EXCLUDED.image
            RETURNING id
          `;
          const dbUser = result.rows[0];

          if (dbUser) {
            // Ensure profile exists
            await sql`
              INSERT INTO user_profiles (user_id, balance, avatar_url)
              VALUES (${dbUser.id}, 1000.00, ${user.image})
              ON CONFLICT (user_id) DO NOTHING
            `;
          }
        }
      } catch (error) {
        console.error("Sign-in callback error:", error);
        // We still return true to allow the login to proceed, 
        // even if the profile upsert failed (it will try again later).
      }
      return true;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub;
        
        try {
          // Fetch balance and latest profile info
          let result = await sql`SELECT balance, avatar_url FROM user_profiles WHERE user_id = ${token.sub}`;
          
          // If profile is missing (e.g. registration error), create it with defaults now
          if (!result.rows || result.rows.length === 0) {
            console.log(`Creating missing profile for user ${token.sub}`);
            await sql`
              INSERT INTO user_profiles (user_id, balance, avatar_url)
              VALUES (${token.sub}, 1000.00, '/avatars/default.png')
              ON CONFLICT (user_id) DO NOTHING
            `;
            // Fetch again
            result = await sql`SELECT balance, avatar_url FROM user_profiles WHERE user_id = ${token.sub}`;
          }

          if (result && result.rows && result.rows[0]) {
            (session.user as any).balance = parseFloat(result.rows[0].balance.toString());
            (session.user as any).image = result.rows[0].avatar_url || session.user.image;
          } else {
            // Absolute fallback
            (session.user as any).balance = 1000.00;
          }
        } catch (error) {
          console.error("Session callback error:", error);
          (session.user as any).balance = 1000.00; // Emergency fallback
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

export default NextAuth(authOptions);
