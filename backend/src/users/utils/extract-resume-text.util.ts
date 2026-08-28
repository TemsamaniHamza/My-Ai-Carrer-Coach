import { BadRequestException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

// Shared with the FileInterceptor limit in UsersController and the
// belt-and-suspenders check in UsersService.extractProfileFromResume.
export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
} as const;

export function isSupportedResumeFile(mimetype: string): boolean {
  return mimetype in SUPPORTED_MIME_TYPES;
}

/**
 * Extracts plain text from an uploaded resume file. Only PDF and DOCX are
 * supported — legacy .doc (application/msword) isn't, since mammoth only
 * reads the OOXML format, and validating that up front (isSupportedResumeFile,
 * checked before this is even called) gives a clearer error than a parse
 * failure here would.
 */
export async function extractResumeText(buffer: Buffer, mimetype: string): Promise<string> {
  const kind = SUPPORTED_MIME_TYPES[mimetype as keyof typeof SUPPORTED_MIME_TYPES];

  if (kind === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } catch {
      throw new BadRequestException(
        "Couldn't read that PDF — it may be corrupted, password-protected, or scanned images rather than text.",
      );
    } finally {
      await parser.destroy();
    }
  }

  if (kind === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      throw new BadRequestException("Couldn't read that Word document — it may be corrupted.");
    }
  }

  // Unreachable if isSupportedResumeFile was checked first, but keeps this
  // function safe to call on its own too.
  throw new BadRequestException('Unsupported file type — upload a PDF or DOCX resume.');
}
