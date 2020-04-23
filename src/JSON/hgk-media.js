module.exports = {
  title: 'HGK MEDIA Submission Form',
  schema: {
    '$id': 'https://mediathek.hgk.fhnw.ch/media.schema.json', // Path to defined Schema or api response
    '$schema': 'http://json-schema.org/draft-07/schema#',
    title: 'MEDIA',
    description: 'Schema template example for <a href="https://ba14ns21403.fhnw.ch/mediaserver/app/upload/act.php">this From</a>',
    type: 'object',
    required: ['form'],
    properties: {
      template: {
        type: 'string',
        'x-itemClass': 'xs12 md6',
        title: 'Select Type ...',
        description: 'Select the Role of the Person',
        oneOf: { $ref: '#/definitions/typeEntity/enum' }
      },
      organisation: {
        type: 'object',
        format: 'group',
        allOf: [{ $ref: '#/definitions/orgaEntity' }]
      },
      persons: {
        type: 'array',
        title: 'Persons',
        description: 'A list people involved.',
        items: [{ '$ref': '#/definitions/personEntity' }]
      },
      work: {
        type: 'object',
        title: 'Details',
        format: 'expansion',
        allOf: [
          { $ref: '#/definitions/mediaEntity' },
          { $ref: '#/definitions/performanceEntity' }
        ]
      }
    },
    definitions: {
      orgaEntity: {
        title: 'Organisation Details',
        type: 'object',
        format: 'inline',
        required: ['license', 'access', 'access'],
        properties: {
          partner: {
            type: 'string',
            title: 'Partner',
            'x-itemClass': 'xs12 md7'
          },
          projectType: {
            type: 'string',
            title: 'Projekt Typ',
            'x-itemClass': 'xs12 md7'
          },
          financing: {
            'x-itemClass': 'xs12 md5',
            title: 'Finanzierung',
            type: 'string'
          },
          projectID: {
            title: 'Projekt ID',
            type: 'string',
            'x-itemClass': 'xs6 md4'
          },
          DDC: {
            title: 'DDC',
            type: 'string',
            'x-itemClass': 'xs6 md4'
          },
          visibility: {
            title: 'Visibility',
            type: 'string',
            description: 'Select the access',
            'x-itemClass': 'xs12 md4',
            oneOf: { $ref: '#/definitions/visibilityEntity/enum' }
          }
        }
      },
      eventEntity: {
        title: 'Event Details',
        description: 'Lorem ipsum ...',
        type: 'object',
        format: 'inline',
        properties: {
          organiser: {
            type: 'string',
            title: 'Organizer',
            'x-icon': 'account_balance',
            'x-itemClass': 'xs12 md7'
          },
          year: {
            'x-itemClass': 'xs12 md5',
            title: 'Year',
            type: 'string',
            format: 'year'
          },
          location: {
            title: 'Venue',
            type: 'string',
            description: 'Where is this Event?',
            'x-itemClass': 'xs12 md7'
          }
        }
      },
      personEntity: {
        type: 'object',
        title: 'Person Details',
        format: 'inline',
        required: [ 'lastName', 'email', 'role' ],
        properties: {
          firstName: {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          },
          lastName: {
            type: 'string',
            'x-itemClass': 'xs12 md6'
          },
          email: {
            type: 'string',
            'x-itemClass': 'xs12 md6'
          },
          institute: {
            type: 'string',
            'x-itemClass': 'xs12 md6'
          },
          role: {
            title: 'Role',
            type: 'string',
            'x-itemClass': 'xs12 md6',
            description: 'Select the Role of the Person',
            oneOf: { $ref: '#/definitions/roleEntity/enum' }
          },
          website: {
            'type': 'string',
            'x-itemClass': 'xs12 md6'
          }
        }
      },
      performanceEntity: {
        title: 'Work',
        format: 'inline',
        description: 'Details and meta data about this Work.',
        properties: {
          description: {
            title: 'Idea/Description',
            type: 'string',
            maxLength: 2000
          },
          tags: {
            type: 'array',
            description: 'This is a simple array of strings',
            items: {
              type: 'string'
            }
          },
          duration: {
            type: 'string',
            description: 'This is a simple array of strings',
            'x-itemClass': 'xs12'
          },
          space: {
            title: 'Space',
            description: 'setting/stage design/public sphere/agile etc.',
            type: 'string',
            maxLength: 2000,
            'x-itemClass': 'xs12'
          },
          technics: {
            title: 'Technics (what you bring / what you need)',
            description: 'i will bring / i need',
            type: 'string',
            maxLength: 2000,
            'x-itemClass': 'xs12'
          },
          university: {
            title: 'University',
            description: 'i will bring / i need',
            type: 'string',
            maxLength: 300,
            'x-itemClass': 'xs12 md6'
          },
          institute: {
            title: 'Institute',
            description: 'i will bring / i need',
            type: 'string',
            maxLength: 300,
            'x-itemClass': 'xs12 md6'
          }
        }
      },
      mediaEntity: {
        type: 'object',
        title: 'Images and Media',
        description: 'Upload images and edit media properties. <br /> Define a prefilling Template and adjust Meta Data after upload.',
        format: 'inline',
        properties: {
          template: {
            type: 'array',
            items: [
              { $ref: '#/definitions/imageEntity' }
            ]
          },
          upload: {
            type: 'object',
            format: 'upload',
            properties: {
              meta: {
                type: 'array',
                items: [
                  { $ref: '#/definitions/imageEntity' }
                ]
              }
            }
          }
        }
      },
      imageEntity: {
        type: 'object',
        format: 'inline',
        required: ['license', 'access'],
        title: 'Image Meta Data',
        properties: {
          owner: {
            title: 'Rightholder',
            type: 'string'
          },
          license: {
            title: 'License',
            type: 'string'
          },
          reference: {
            title: 'Web Reference',
            type: 'string',
            placeholder: 'https:// ...'
          },
          embargo_start: {
            title: 'Embargo Start',
            type: 'string',
            format: 'date',
            'x-itemClass': 'xs12 md4'
          },
          embargo_end: {
            title: 'Embargo End',
            type: 'string',
            format: 'date',
            'x-itemClass': 'xs12 md4'
          },
          access: {
            title: 'Access',
            type: 'string',
            description: 'Select the access',
            'x-itemClass': 'xs12 md4',
            oneOf: { $ref: '#/definitions/visibilityEntity/enum' }
          },
          legend: {
            title: 'Legend Reference',
            type: 'string'
          }
        }
      },
      roleEntity: {
        type: 'string',
        enum: [
          {
            const: 'artist',
            title: 'Artist'
          },
          {
            const: 'involved',
            title: 'Performer Involved'
          },
          {
            const: 'docu',
            title: 'Documentalist'
          },
          {
            const: 'feedback',
            title: 'Feedback'
          },
          {
            const: 'mentor',
            title: 'Feedback'
          },
          {
            const: 'group_mentor',
            title: 'Group Mentor'
          }
        ]
      },
      visibilityEntity: {
        type: 'string',
        enum: [
          {
            const: 'public',
            title: 'Internet'
          },
          {
            const: 'internal',
            title: 'FHNW'
          },
          {
            const: 'resricted',
            title: 'Restricted'
          }
        ]
      },
      typeEntity: {
        type: 'string',
        enum: [
          {
            const: 'act',
            title: 'Act'
          },
          {
            const: 'event',
            title: 'Event'
          },
          {
            const: 'publication',
            title: 'Publication'
          },
          {
            const: 'activity',
            title: 'Activity'
          }
        ]
      }
    }
  },
  data: {
    organisation: {
      partner: 'FHNW'
    }
  }
}
