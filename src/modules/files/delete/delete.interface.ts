import { IsMongoId, IsNotEmpty } from 'class-validator';

export class DeleteFileDto {
  @IsNotEmpty()
  @IsMongoId()
  id: string;
}

export enum DeleteFileType {
  ID = 'ID',
}

export class IDeleteFile {
  value: string;
  // company: string;
  type: DeleteFileType;
}
