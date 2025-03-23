import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config({ path: "../backend/.env" });

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
