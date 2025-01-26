import { User, UserSchema } from 'src/modules/users/users.schema';

export const MongoCollection = {
  users: { name: User.name, schema: UserSchema },
};
