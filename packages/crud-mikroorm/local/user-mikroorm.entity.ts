import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'users2' })
export class Users {
  @PrimaryKey()
  id?: number;

  @Property()
  nameFirst!: string;

  @Property()
  nameLast!: string;

  @Property({ nullable: true, name: 'deleted_at' })
  deletedAt?: Date;
}
