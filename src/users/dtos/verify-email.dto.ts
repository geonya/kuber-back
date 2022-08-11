import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Verification } from 'src/users/entities/verification.entity';

@InputType('VerifyEmailInputType')
export class VerifyEmailInput extends PickType(Verification, ['code']) {}
@ObjectType()
export class VerifyEmailOutput extends CoreOutput {}
