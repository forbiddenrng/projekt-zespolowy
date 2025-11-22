import { PartialType } from '@nestjs/mapped-types';
import { CertificateDto } from './create-certificate.dto';

export class UpdateCertificateDto extends PartialType(CertificateDto) {}
