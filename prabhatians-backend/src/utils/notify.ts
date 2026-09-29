import { Notification } from "../models";
export async function notify(userId: string, type: string, message: string, link?: string): Promise<void> { await Notification.create({ user: userId, type, message, link }); }
