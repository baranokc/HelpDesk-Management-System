import * as z from "zod";

const eMailSchema = z.string().trim().min(1, {error: "E-mail address is required.",})
                    .pipe(z.email({error: "Please enter a valid e-mail address.",}));

export const loginSchema = z.object({email: eMailSchema, password : z.string().min(1, {error: "Password is required",})
                                                                              .min(6, {error: "Password must be at least 6 characters long",}),});

export const registerSchema = z.object({email: eMailSchema, 
                                        password : z.string().min(6, {error : "Password must be at least 6 characters long",}),
                                        name: z.string().trim().min(1, {error : "First name is required.",}),
                                        lastName: z.string().trim().min(1, {error : "Last name is required.",}), });

export type LoginDto = z.output<typeof loginSchema>;
export type UserCreateDto = z.output<typeof registerSchema>;
