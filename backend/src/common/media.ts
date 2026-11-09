import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class MediaDto {
  @IsString() @MaxLength(500) url: string;
  @IsIn(['image', 'video']) type: 'image' | 'video';
  @IsOptional() @IsString() @MaxLength(200) name?: string;
}

/** Dekorator gabungan untuk field lampiran foto/video (maks. 20 file) */
export function MediaField() {
  return (target: object, key: string) => {
    IsOptional()(target, key);
    IsArray()(target, key);
    ArrayMaxSize(20)(target, key);
    ValidateNested({ each: true })(target, key);
    Type(() => MediaDto)(target, key);
  };
}
