
export interface ConfigNode {
  id: string;               // Eindeutige ID (wichtig für TrackBy im HTML)
  tag: string;              // Der XML-Tag-Name (z.B. "Database", "User", "Host")

  // Alle Attribute, die DIREKT im Tag stehen <Tag attr="wert">
  attributes: { [key: string]: string };

  // Alle Unter-Elemente
  children: ConfigNode[];

  // Der Text zwischen den Tags <Tag>Inhalt</Tag>
  textContent?: string;

  // Hilfs-Flags für die UI
  isOpen?: boolean;         // Ist der Baum im Editor ausgeklappt?
  isTextTag?: boolean;      // Handelt es sich um ein einfaches Feld wie <Username>?
}

export interface TagDefinition {
  attributes: string[];
  textTags: string[];
  childSections: string[];
  allowMultiple: boolean;
}

export interface ModuleRule {
  allowedTopLevelSections: string[];
  definitions: { [tagName: string]: TagDefinition };
}

export const MODULE_CONFIG_RULES: { [moduleName: string]: ModuleRule } = {
  'Persistence': {
    allowedTopLevelSections: ['Database', 'Users', 'Roles'],
    definitions: {
      'Database': {
        attributes: ['name', 'type', 'host', 'port', 'encrypt', 'main'],
        textTags: ['Username', 'Password'],
        childSections: [],
        allowMultiple: true
      },
      'Users': {
        attributes: [],
        textTags: [],
        childSections: ['User'],
        allowMultiple: false
      },
      'User': {
        attributes: ['name', 'email', 'password', 'role'],
        textTags: [],
        childSections: [],
        allowMultiple: true
      },
      'Roles': {
        attributes: [],
        textTags: [],
        childSections: ['Role'],
        allowMultiple: false
      },
      'Role': {
        attributes: ['name', 'description'],
        textTags: [],
        childSections: [],
        allowMultiple: true
      }
    }
  },

  'TCP': {
    allowedTopLevelSections: ['Connectable'],
    definitions: {
      'Connectable': {
        attributes: ['name', 'active', 'prefix', 'suffix'],
        textTags: [],
        childSections: ['Connection', 'Processor'],
        allowMultiple: true
      },
      'Connection': {
        attributes: [],
        textTags: ['Host', 'Port', 'Timeout'],
        childSections: [],
        allowMultiple: false
      },
      'Processor': {
        attributes: ['name'],
        textTags: [],
        childSections: [],
        allowMultiple: true
      }
    }
  },

  'UDP': {
    allowedTopLevelSections: ['Connectable'],
    definitions: {
      // Nutzt die gleiche Logik wie TCP
      'Connectable': {
        attributes: ['name', 'active', 'prefix', 'suffix'],
        textTags: [],
        childSections: ['Connection', 'Processor'],
        allowMultiple: true
      },
      'Connection': {
        attributes: [],
        textTags: ['Host', 'Port', 'Timeout'],
        childSections: [],
        allowMultiple: false
      },
      'Processor': {
        attributes: ['name'],
        textTags: [],
        childSections: [],
        allowMultiple: true
      }
    }
  },

  'UI': {
    allowedTopLevelSections: ['Navbar'],
    definitions: {
      'Navbar': {
        attributes: [],
        textTags: [],
        childSections: ['Items'],
        allowMultiple: false
      },
      'Items': {
        attributes: [],
        textTags: [],
        childSections: ['Group', 'Item'],
        allowMultiple: false
      },
      'Group': {
        attributes: ['id', 'label', 'color', 'order'],
        textTags: [],
        childSections: ['Item'],
        allowMultiple: true
      },
      'Item': {
        attributes: ['id', 'label', 'color', 'order'],
        textTags: [],
        childSections: [],
        allowMultiple: true
      }
    }
  },

  'StockMovement': {
    allowedTopLevelSections: ['StorageSystem', 'Loadunit'],
    definitions: {
      'StorageSystem': {
        attributes: [],
        textTags: [],
        childSections: ['SRM'],
        allowMultiple: false
      },
      'SRM': {
        attributes: ['id', 'pattern'],
        textTags: [],
        childSections: ['Rack', 'Forks'],
        allowMultiple: true
      },
      'Rack': {
        attributes: [],
        textTags: [],
        childSections: ['Side'],
        allowMultiple: false
      },
      'Side': {
        attributes: ['type'],
        textTags: [],
        childSections: ['Range'],
        allowMultiple: true
      },
      'Range': {
        attributes: [],
        textTags: ['Permission'],
        childSections: ['X', 'Y', 'Depth'],
        allowMultiple: true
      },
      'X': { attributes: ['start', 'end'], textTags: [], childSections: [], allowMultiple: false },
      'Y': { attributes: ['start', 'end'], textTags: [], childSections: [], allowMultiple: false },
      'Depth': { attributes: ['count'], textTags: [], childSections: [], allowMultiple: false },
      'Forks': {
        attributes: [],
        textTags: [],
        childSections: ['Fork'],
        allowMultiple: false
      },
      'Fork': {
        attributes: ['name'],
        textTags: [],
        childSections: ['EntryPoints', 'ExitPoins'],
        allowMultiple: true
      },
      'EntryPoints': { attributes: [], textTags: ['Entry'], childSections: [], allowMultiple: false },
      'ExitPoins': { attributes: [], textTags: ['Exit'], childSections: [], allowMultiple: false },
      'Loadunit': {
        attributes: [],
        textTags: [],
        childSections: ['Categories', 'Permissions'],
        allowMultiple: false
      },
      'Categories': {
        attributes: [],
        textTags: [],
        childSections: ['Categorie'],
        allowMultiple: false
      },
      'Categorie': {
        attributes: ['name', 'height', 'width', 'length', 'minWeight', 'maxWeight'],
        textTags: [],
        childSections: [],
        allowMultiple: true
      },
      'Permissions': {
        attributes: [],
        textTags: [],
        childSections: ['Permission'],
        allowMultiple: false
      },
      'Permission': {
        attributes: ['name'],
        textTags: ['Categorie'], // Erlaubt einfache <Categorie>A</Categorie> Tags
        childSections: [],
        allowMultiple: true
      }
    }
  },

  'InventoryManagement': {
    allowedTopLevelSections: [],
    definitions: {},
  }
};
