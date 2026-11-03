// lib/validationSchemas.js
import * as yup from 'yup';

export const checkoutSchema = yup.object().shape({
  fullName: yup.string().trim().required("Full name is required").min(3, "Name must be at least 3 characters"),
  phone: yup.string().trim().required("Phone number is required").matches(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number"),
  email: yup.string().trim().email("Enter a valid email address").optional(),
  addressLine1: yup.string().trim().required("Street address is required"),
  addressLine2: yup.string().trim().optional(),
  city: yup.string().trim().required("City is required"),
  state: yup.string().trim().required("State is required"),
  postalCode: yup.string().trim().required("Postal code is required").matches(/^\d{6}$/, "Must be a valid 6-digit PIN code"),
  selectedVariantSize: yup.string().optional(),
  selectedColor: yup.string().optional(),
  referralCode: yup.string().trim().uppercase().max(16, "Invalid referral code").optional(),
  redeemPoints: yup.number().typeError("Points must be a number").min(0, "Cannot be negative").default(0)
});

export const searchFilterSchema = yup.object().shape({
  query: yup.string().trim().optional(),
  brand: yup.string().optional(),
});

export const rewardClaimSchema = yup.object().shape({
  phone: yup.string().trim().required("Phone number is required").matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit number"),
  otp: yup.string().trim().required("OTP is required").matches(/^\d{4,6}$/, "OTP must be 4 to 6 digits"),
});

export const productReviewSchema = yup.object().shape({
  authorName: yup.string().required("Name is required"),
  rating: yup.number().min(1).max(5).required(),
  reviewText: yup.string().min(10, "Review must be at least 10 characters").required(),
});