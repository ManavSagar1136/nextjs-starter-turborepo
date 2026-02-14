import { prisma } from "@buildbase/database";
import type { User } from "@prisma/client";

export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const createUser = async (data: { email: string; name?: string }): Promise<User> => {
  return prisma.user.create({
    data: {
      sdkUserId: crypto.randomUUID(),
      email: data.email,
      name: data.name,
    },
  });
};

export const updateUser = async (id: string, data: { email?: string; name?: string }): Promise<User> => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string): Promise<User> => {
  return prisma.user.delete({
    where: { id },
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
};
