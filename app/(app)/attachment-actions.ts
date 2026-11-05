"use server";

import { addAttachment, removeAttachment, transcribeAttachment } from "@/lib/data/attachments";

export async function addAttachmentAction(input: Parameters<typeof addAttachment>[0]) {
  return addAttachment(input);
}

export async function removeAttachmentAction(id: string) {
  await removeAttachment(id);
}

export async function transcribeAction(id: string) {
  return transcribeAttachment(id);
}
