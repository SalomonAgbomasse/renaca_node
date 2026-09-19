import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entity/system-setting.entity';

@Injectable()
export class SystemSettingService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
  ) {}

  /**
   * Récupérer tous les paramètres
   */
  async findAll(): Promise<SystemSetting[]> {
    return this.settingRepository.find({ order: { key: 'ASC' } });
  }

  /**
   * Récupérer la valeur d'un paramètre spécifique
   * @param key Clé du paramètre
   * @param defaultValue Valeur par défaut si le paramètre n'existe pas
   */
  async get(key: string, defaultValue = ''): Promise<string> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    return setting ? setting.value : defaultValue;
  }

  /**
   * Définir ou mettre à jour un paramètre
   * @param key Clé du paramètre
   * @param value Nouvelle valeur
   * @param description Explication facultative
   */
  async set(key: string, value: string, description?: string): Promise<SystemSetting> {
    let setting = await this.settingRepository.findOne({ where: { key } });

    if (setting) {
      setting.value = value;
      if (description !== undefined) {
        setting.description = description;
      }
    } else {
      setting = this.settingRepository.create({
        key,
        value,
        description: description || '',
      });
    }

    return this.settingRepository.save(setting);
  }

  /**
   * Mise à jour en masse des paramètres
   * @param settings Tableau de couples clé/valeur
   */
  async updateMultiple(settings: Array<{ key: string; value: string }>): Promise<SystemSetting[]> {
    const updatedSettings: SystemSetting[] = [];
    
    for (const item of settings) {
      const updated = await this.set(item.key, item.value);
      updatedSettings.push(updated);
    }
    
    return updatedSettings;
  }
}
