import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

/**
 * Entity pour enregistrer tous les logs d'audit des actions utilisateur
 */
@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
@Index(['sessionId'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID de l'utilisateur qui a effectué l'action
   */
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  /**
   * Relation avec l'utilisateur
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /**
   * Type d'action (GET, POST, PUT, DELETE, etc.)
   */
  @Column({ type: 'varchar', length: 10 })
  method: string;

  /**
   * Route/endpoint appelé
   */
  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  /**
   * Action effectuée (ex: "CREATE_CONTRACT", "UPDATE_USER", "LOGIN", etc.)
   */
  @Column({ type: 'varchar', length: 100 })
  action: string;

  /**
   * Description de l'action
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Données de la requête (masquées pour les données sensibles)
   */
  @Column({ type: 'json', nullable: true })
  requestData: any;

  /**
   * Réponse de la requête (masquée pour les données sensibles)
   */
  @Column({ type: 'json', nullable: true })
  responseData: any;

  /**
   * Code de statut HTTP
   */
  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  /**
   * Adresse IP de l'utilisateur
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  /**
   * User-Agent du navigateur
   */
  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  /**
   * ID de session
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId: string | null;

  /**
   * Durée de la requête en millisecondes
   */
  @Column({ type: 'int', nullable: true })
  duration: number | null;

  /**
   * Erreur éventuelle
   */
  @Column({ type: 'text', nullable: true })
  error: string | null;

  /**
   * Métadonnées supplémentaires
   */
  @Column({ type: 'json', nullable: true })
  metadata: any;

  /**
   * Date de création du log
   */
  @CreateDateColumn()
  createdAt: Date;
}
